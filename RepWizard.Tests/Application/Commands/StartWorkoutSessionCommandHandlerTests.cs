using FluentAssertions;
using Moq;
using RepWizard.Application.Commands.Workouts.StartWorkoutSession;
using RepWizard.Core.Entities;
using RepWizard.Core.Interfaces.Repositories;

namespace RepWizard.Tests.Application.Commands;

public class StartWorkoutSessionCommandHandlerTests
{
    private readonly Mock<IWorkoutSessionRepository> _sessionRepo = new();
    private readonly StartWorkoutSessionCommandHandler _handler;

    public StartWorkoutSessionCommandHandlerTests()
    {
        _handler = new StartWorkoutSessionCommandHandler(_sessionRepo.Object);
    }

    [Fact]
    public async Task Handle_NoActiveSession_CreatesAndReturnsSession()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _sessionRepo.Setup(r => r.GetActiveSessionForUserAsync(userId, default))
            .ReturnsAsync((WorkoutSession?)null);
        _sessionRepo.Setup(r => r.AddAsync(It.IsAny<WorkoutSession>(), default))
            .Returns(Task.CompletedTask);
        _sessionRepo.Setup(r => r.SaveChangesAsync(default))
            .ReturnsAsync(1);

        var command = new StartWorkoutSessionCommand(userId, null, null);

        // Act
        var result = await _handler.Handle(command, default);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.UserId.Should().Be(userId);
        result.Value.IsActive.Should().BeTrue();
        _sessionRepo.Verify(r => r.AddAsync(It.Is<WorkoutSession>(s => s.UserId == userId), default), Times.Once);
        _sessionRepo.Verify(r => r.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task Handle_ActiveSessionExists_ReturnsFailure()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var existing = new WorkoutSession { UserId = userId, StartedAt = DateTime.UtcNow };
        _sessionRepo.Setup(r => r.GetActiveSessionForUserAsync(userId, default))
            .ReturnsAsync(existing);

        var command = new StartWorkoutSessionCommand(userId, null, null);

        // Act
        var result = await _handler.Handle(command, default);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("already active");
        _sessionRepo.Verify(r => r.AddAsync(It.IsAny<WorkoutSession>(), default), Times.Never);
    }

    [Fact]
    public async Task Handle_WithTemplateId_SetsTemplateOnSession()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var templateId = Guid.NewGuid();
        _sessionRepo.Setup(r => r.GetActiveSessionForUserAsync(userId, default))
            .ReturnsAsync((WorkoutSession?)null);
        _sessionRepo.Setup(r => r.AddAsync(It.IsAny<WorkoutSession>(), default))
            .Returns(Task.CompletedTask);
        _sessionRepo.Setup(r => r.SaveChangesAsync(default))
            .ReturnsAsync(1);

        var command = new StartWorkoutSessionCommand(userId, templateId, "Test notes");

        // Act
        var result = await _handler.Handle(command, default);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.TemplateId.Should().Be(templateId);
        result.Value.Notes.Should().Be("Test notes");
    }
}
