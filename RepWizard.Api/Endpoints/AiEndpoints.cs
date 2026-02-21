using System.Text;
using System.Text.Json;
using MediatR;
using RepWizard.Application.Commands.Ai.SaveAiMessage;
using RepWizard.Application.Queries.Ai.GetConversation;
using RepWizard.Application.Queries.Ai.GetConversations;
using RepWizard.Application.Services;
using RepWizard.Core.Interfaces.Services;
using RepWizard.Shared.DTOs;

namespace RepWizard.Api.Endpoints;

public static class AiEndpoints
{
    private static readonly JsonSerializerOptions SseJsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public static IEndpointRouteBuilder MapAiEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/ai")
            .WithTags("AI Coach");

        // POST /api/v1/ai/chat — SSE streaming chat
        group.MapPost("/chat", async (
            SendChatRequest request,
            IMediator mediator,
            IAiChatService aiChatService,
            AiContextBuilder contextBuilder,
            IConfiguration configuration,
            CancellationToken ct) =>
        {
            // Validate request
            if (string.IsNullOrWhiteSpace(request.Message))
                return Results.BadRequest(ApiResponse<object>.Fail("Message is required."));

            if (request.UserId == Guid.Empty)
                return Results.BadRequest(ApiResponse<object>.Fail("UserId is required."));

            // Determine conversation ID — create new conversation if not provided
            var conversationId = request.ConversationId ?? Guid.Empty;

            // Save the user message (creates conversation if ConversationId is empty)
            var saveUserResult = await mediator.Send(
                new SaveAiMessageCommand(conversationId, "User", request.Message, null), ct);

            if (saveUserResult.IsFailure)
                return Results.BadRequest(ApiResponse<object>.Fail(saveUserResult.Error!));

            // If we created a new conversation, get the conversation ID from the saved message
            // by querying for the conversation that owns this message
            Guid activeConversationId;
            if (conversationId == Guid.Empty)
            {
                // The handler created a new conversation — we need to find its ID.
                // The message was saved, so we query conversations for this user to get the latest.
                var conversationsResult = await mediator.Send(
                    new GetConversationsQuery(request.UserId), ct);

                if (conversationsResult.IsFailure || conversationsResult.Value!.Count == 0)
                    return Results.BadRequest(ApiResponse<object>.Fail("Failed to create conversation."));

                activeConversationId = conversationsResult.Value!.First().Id;
            }
            else
            {
                activeConversationId = conversationId;
            }

            // Build user context for the AI
            var userContext = await contextBuilder.BuildContextAsync(request.UserId, ct);

            // Get system prompt from configuration
            var systemPrompt = configuration["AiCoach:SystemPrompt"]
                ?? "You are a helpful fitness coach.";

            // Append user context to system prompt
            var fullSystemPrompt = $"{systemPrompt}\n\n<user_context>\n{userContext}\n</user_context>";

            // Get conversation messages for AI context
            var conversationResult = await mediator.Send(
                new GetConversationQuery(activeConversationId), ct);

            if (conversationResult.IsFailure)
                return Results.BadRequest(ApiResponse<object>.Fail(conversationResult.Error!));

            // Convert conversation messages to AiChatMessage format
            var chatMessages = conversationResult.Value!.Messages
                .Where(m => m.Role is "User" or "Assistant")
                .Select(m => new AiChatMessage(m.Role.ToLowerInvariant(), m.Content))
                .ToList() as IReadOnlyList<AiChatMessage>;

            // Stream the response back as SSE
            return Results.Stream(async stream =>
            {
                var writer = new StreamWriter(stream, Encoding.UTF8, leaveOpen: true);
                var fullResponse = new StringBuilder();

                // Send the conversation ID as the first event so the client knows which conversation this is
                var idEvent = JsonSerializer.Serialize(
                    new { conversationId = activeConversationId }, SseJsonOptions);
                await writer.WriteAsync($"data: {idEvent}\n\n");
                await writer.FlushAsync();

                try
                {
                    await foreach (var chunk in aiChatService.StreamChatAsync(
                        fullSystemPrompt, chatMessages, ct))
                    {
                        fullResponse.Append(chunk);

                        var sseData = JsonSerializer.Serialize(
                            new { content = chunk }, SseJsonOptions);
                        await writer.WriteAsync($"data: {sseData}\n\n");
                        await writer.FlushAsync();
                    }

                    // Send done event
                    await writer.WriteAsync("data: [DONE]\n\n");
                    await writer.FlushAsync();

                    // Save the assistant's complete response
                    await mediator.Send(
                        new SaveAiMessageCommand(
                            activeConversationId,
                            "Assistant",
                            fullResponse.ToString(),
                            null),
                        ct);
                }
                catch (OperationCanceledException)
                {
                    // Client disconnected — save partial response if we have content
                    if (fullResponse.Length > 0)
                    {
                        await mediator.Send(
                            new SaveAiMessageCommand(
                                activeConversationId,
                                "Assistant",
                                fullResponse.ToString(),
                                null),
                            CancellationToken.None);
                    }
                }
                catch (Exception ex)
                {
                    var errorEvent = JsonSerializer.Serialize(
                        new { error = ex.Message }, SseJsonOptions);
                    await writer.WriteAsync($"data: {errorEvent}\n\n");
                    await writer.FlushAsync();
                }
            }, "text/event-stream");
        })
        .WithName("StreamChat")
        .WithSummary("Send a message to the AI Coach and receive a streaming SSE response");

        // GET /api/v1/ai/conversations?userId={id} — list conversations
        group.MapGet("/conversations", async (
            Guid userId,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var result = await mediator.Send(new GetConversationsQuery(userId), ct);

            return result.IsSuccess
                ? Results.Ok(ApiResponse<IReadOnlyList<AiConversationDto>>.Ok(result.Value!))
                : Results.BadRequest(ApiResponse<object>.Fail(result.Error!));
        })
        .WithName("GetConversations")
        .WithSummary("List all AI Coach conversations for a user");

        // GET /api/v1/ai/conversations/{id} — get conversation detail with messages
        group.MapGet("/conversations/{id:guid}", async (
            Guid id,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var result = await mediator.Send(new GetConversationQuery(id), ct);

            return result.IsSuccess
                ? Results.Ok(ApiResponse<AiConversationDetailDto>.Ok(result.Value!))
                : Results.NotFound(ApiResponse<object>.Fail(result.Error!));
        })
        .WithName("GetConversation")
        .WithSummary("Get an AI Coach conversation with all messages");

        // POST /api/v1/ai/generate-program — program generation (stub)
        group.MapPost("/generate-program", (
            GenerateProgramRequest request,
            IMediator mediator,
            CancellationToken ct) =>
        {
            if (request.UserId == Guid.Empty)
                return Results.BadRequest(ApiResponse<object>.Fail("UserId is required."));

            if (request.ConversationId == Guid.Empty)
                return Results.BadRequest(ApiResponse<object>.Fail("ConversationId is required."));

            // Stub: stream back a placeholder message indicating program generation is available
            return Results.Stream(async stream =>
            {
                var writer = new StreamWriter(stream, Encoding.UTF8, leaveOpen: true);

                var message = "Program generation is available. "
                    + "To generate a training program, please discuss your goals, experience level, "
                    + "available equipment, and weekly schedule with the AI Coach first. "
                    + "The coach will then create a periodized program tailored to your needs.";

                var sseData = JsonSerializer.Serialize(
                    new { content = message, status = "stub" }, SseJsonOptions);
                await writer.WriteAsync($"data: {sseData}\n\n");
                await writer.WriteAsync("data: [DONE]\n\n");
                await writer.FlushAsync();
            }, "text/event-stream");
        })
        .WithName("GenerateProgram")
        .WithSummary("Generate a training program based on AI Coach conversation (stub — will be refined)");

        return app;
    }
}
