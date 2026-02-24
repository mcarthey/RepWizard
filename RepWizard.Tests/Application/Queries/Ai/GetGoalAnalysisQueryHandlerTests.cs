using FluentAssertions;
using Moq;
using RepWizard.Application.Queries.Ai.GetGoalAnalysis;
using RepWizard.Application.Services;
using RepWizard.Core.Entities;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Core.Interfaces.Services;

namespace RepWizard.Tests.Application.Queries.Ai;

public class GetGoalAnalysisQueryHandlerTests
{
    private readonly Mock<IWorkoutSessionRepository> _sessionRepo = new();
    private readonly Mock<IBodyMeasurementRepository> _measurementRepo = new();
    private readonly Mock<ITrainingProgramRepository> _programRepo = new();
    private readonly Mock<IUserRepository> _userRepo = new();
    private readonly Mock<IAiChatService> _aiService = new();
    private readonly GetGoalAnalysisQueryHandler _handler;

    public GetGoalAnalysisQueryHandlerTests()
    {
        var contextBuilder = new AiContextBuilder(
            _sessionRepo.Object,
            _measurementRepo.Object,
            _programRepo.Object,
            _userRepo.Object);

        _handler = new GetGoalAnalysisQueryHandler(contextBuilder, _aiService.Object);

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
    public async Task Handle_WithAiResponse_ReturnsAnalysis()
    {
        _aiService.Setup(s => s.ChatAsync(
                It.IsAny<string>(), It.IsAny<IReadOnlyList<AiChatMessage>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("Your goal of building muscle mass in 6 months is realistic given your training frequency.");

        var result = await _handler.Handle(new GetGoalAnalysisQuery(Guid.NewGuid()), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value!.HasAnalysis.Should().BeTrue();
        result.Value.AnalysisText.Should().Contain("building muscle mass");
    }

    [Fact]
    public async Task Handle_WithEmptyResponse_ReturnsNoAnalysis()
    {
        _aiService.Setup(s => s.ChatAsync(
                It.IsAny<string>(), It.IsAny<IReadOnlyList<AiChatMessage>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("   ");

        var result = await _handler.Handle(new GetGoalAnalysisQuery(Guid.NewGuid()), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value!.HasAnalysis.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WhenAiThrows_ReturnsNoAnalysisGracefully()
    {
        _aiService.Setup(s => s.ChatAsync(
                It.IsAny<string>(), It.IsAny<IReadOnlyList<AiChatMessage>>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Service unavailable"));

        var result = await _handler.Handle(new GetGoalAnalysisQuery(Guid.NewGuid()), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value!.HasAnalysis.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_TrimsWhitespaceFromResponse()
    {
        _aiService.Setup(s => s.ChatAsync(
                It.IsAny<string>(), It.IsAny<IReadOnlyList<AiChatMessage>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("  Great progress so far.  ");

        var result = await _handler.Handle(new GetGoalAnalysisQuery(Guid.NewGuid()), CancellationToken.None);

        result.Value!.AnalysisText.Should().Be("Great progress so far.");
    }
}
