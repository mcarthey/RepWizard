using FluentAssertions;
using Moq;
using RepWizard.Application.Queries.Ai.GetPlanInsight;
using RepWizard.Application.Services;
using RepWizard.Core.Entities;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Core.Interfaces.Services;

namespace RepWizard.Tests.Application.Queries.Ai;

public class GetPlanInsightQueryHandlerTests
{
    private readonly Mock<IWorkoutSessionRepository> _sessionRepo = new();
    private readonly Mock<IBodyMeasurementRepository> _measurementRepo = new();
    private readonly Mock<ITrainingProgramRepository> _programRepo = new();
    private readonly Mock<IUserRepository> _userRepo = new();
    private readonly Mock<IAiChatService> _aiService = new();
    private readonly GetPlanInsightQueryHandler _handler;

    public GetPlanInsightQueryHandlerTests()
    {
        var contextBuilder = new AiContextBuilder(
            _sessionRepo.Object,
            _measurementRepo.Object,
            _programRepo.Object,
            _userRepo.Object);

        _handler = new GetPlanInsightQueryHandler(contextBuilder, _aiService.Object);

        SetupEmptyRepositories();
    }

    private void SetupEmptyRepositories()
    {
        _userRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);
        _sessionRepo.Setup(r => r.GetRecentSessionsAsync(It.IsAny<Guid>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<WorkoutSession>());
        _measurementRepo.Setup(r => r.GetLatestForUserAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((BodyMeasurement?)null);
        _programRepo.Setup(r => r.GetActiveForUserAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TrainingProgram?)null);
    }

    [Fact]
    public async Task Handle_WithAiResponse_ReturnsInsight()
    {
        _aiService.Setup(s => s.ChatAsync(
                It.IsAny<string>(), It.IsAny<IReadOnlyList<AiChatMessage>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("Focus on progressive overload for your bench press.");

        var result = await _handler.Handle(new GetPlanInsightQuery(Guid.NewGuid()), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value!.HasInsight.Should().BeTrue();
        result.Value.InsightText.Should().Be("Focus on progressive overload for your bench press.");
    }

    [Fact]
    public async Task Handle_WithEmptyAiResponse_ReturnsNoInsight()
    {
        _aiService.Setup(s => s.ChatAsync(
                It.IsAny<string>(), It.IsAny<IReadOnlyList<AiChatMessage>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(string.Empty);

        var result = await _handler.Handle(new GetPlanInsightQuery(Guid.NewGuid()), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value!.HasInsight.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WhenAiThrows_ReturnsNoInsightGracefully()
    {
        _aiService.Setup(s => s.ChatAsync(
                It.IsAny<string>(), It.IsAny<IReadOnlyList<AiChatMessage>>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new HttpRequestException("API unavailable"));

        var result = await _handler.Handle(new GetPlanInsightQuery(Guid.NewGuid()), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value!.HasInsight.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_TrimsWhitespaceFromResponse()
    {
        _aiService.Setup(s => s.ChatAsync(
                It.IsAny<string>(), It.IsAny<IReadOnlyList<AiChatMessage>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("  Increase your training frequency.  \n");

        var result = await _handler.Handle(new GetPlanInsightQuery(Guid.NewGuid()), CancellationToken.None);

        result.Value!.InsightText.Should().Be("Increase your training frequency.");
    }
}
