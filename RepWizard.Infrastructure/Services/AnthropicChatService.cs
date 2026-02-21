using System.Net.Http.Json;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;
using RepWizard.Core.Interfaces.Services;

namespace RepWizard.Infrastructure.Services;

/// <summary>
/// Implements IAiChatService using the Anthropic Messages API.
/// Uses IHttpClientFactory per project conventions (no raw HttpClient).
/// </summary>
public class AnthropicChatService : IAiChatService
{
    private const string ApiBaseUrl = "https://api.anthropic.com/v1/messages";
    private const string AnthropicVersion = "2023-06-01";
    private const string DefaultModel = "claude-sonnet-4-20250514";

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string _apiKey;
    private readonly string _model;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public AnthropicChatService(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _apiKey = configuration["AiCoach:ApiKey"]
            ?? throw new InvalidOperationException("AiCoach:ApiKey configuration is required.");
        _model = configuration["AiCoach:Model"] ?? DefaultModel;
    }

    public async IAsyncEnumerable<string> StreamChatAsync(
        string systemPrompt,
        IReadOnlyList<AiChatMessage> messages,
        [EnumeratorCancellation] CancellationToken ct)
    {
        var requestBody = BuildRequestBody(systemPrompt, messages, stream: true);
        using var request = CreateHttpRequest(requestBody);

        using var client = _httpClientFactory.CreateClient("Anthropic");
        using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct);
        response.EnsureSuccessStatusCode();

        using var stream = await response.Content.ReadAsStreamAsync(ct);
        using var reader = new StreamReader(stream, Encoding.UTF8);

        while (!reader.EndOfStream && !ct.IsCancellationRequested)
        {
            var line = await reader.ReadLineAsync(ct);

            if (string.IsNullOrEmpty(line))
                continue;

            if (!line.StartsWith("data: "))
                continue;

            var data = line["data: ".Length..];

            if (data == "[DONE]")
                break;

            var text = ExtractTextFromSseEvent(data);
            if (text is not null)
                yield return text;
        }
    }

    public async Task<string> ChatAsync(
        string systemPrompt,
        IReadOnlyList<AiChatMessage> messages,
        CancellationToken ct)
    {
        var requestBody = BuildRequestBody(systemPrompt, messages, stream: false);
        using var request = CreateHttpRequest(requestBody);

        using var client = _httpClientFactory.CreateClient("Anthropic");
        using var response = await client.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();

        var responseJson = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(responseJson);

        var content = doc.RootElement.GetProperty("content");
        var sb = new StringBuilder();

        foreach (var block in content.EnumerateArray())
        {
            if (block.GetProperty("type").GetString() == "text")
            {
                sb.Append(block.GetProperty("text").GetString());
            }
        }

        return sb.ToString();
    }

    private HttpRequestMessage CreateHttpRequest(object requestBody)
    {
        var json = JsonSerializer.Serialize(requestBody, JsonOptions);
        var request = new HttpRequestMessage(HttpMethod.Post, ApiBaseUrl)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };

        request.Headers.Add("x-api-key", _apiKey);
        request.Headers.Add("anthropic-version", AnthropicVersion);

        return request;
    }

    private object BuildRequestBody(
        string systemPrompt,
        IReadOnlyList<AiChatMessage> messages,
        bool stream)
    {
        var apiMessages = messages.Select(m => new
        {
            role = m.Role,
            content = m.Content
        }).ToArray();

        return new
        {
            model = _model,
            max_tokens = 4096,
            system = systemPrompt,
            messages = apiMessages,
            stream
        };
    }

    /// <summary>
    /// Extracts text content from an SSE event JSON payload.
    /// Handles content_block_delta events with text_delta type.
    /// </summary>
    private static string? ExtractTextFromSseEvent(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            var type = root.GetProperty("type").GetString();

            if (type == "content_block_delta")
            {
                var delta = root.GetProperty("delta");
                var deltaType = delta.GetProperty("type").GetString();

                if (deltaType == "text_delta")
                {
                    return delta.GetProperty("text").GetString();
                }
            }

            return null;
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
