using FluentAssertions;
using Moq;
using RepWizard.Application.Commands.Programs.ActivateProgram;
using RepWizard.Core.Entities;
using RepWizard.Core.Interfaces.Repositories;

namespace RepWizard.Tests.Application.Commands.Programs;

public class ActivateProgramCommandHandlerTests
{
    private readonly Mock<ITrainingProgramRepository> _programRepo = new();
    private readonly ActivateProgramCommandHandler _handler;

    public ActivateProgramCommandHandlerTests()
    {
        _handler = new ActivateProgramCommandHandler(_programRepo.Object);
    }

    [Fact]
    public async Task Handle_ValidProgram_ActivatesAndDeactivatesOthers()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var programId = Guid.NewGuid();
        var program = new TrainingProgram
        {
            Id = programId,
            UserId = userId,
            Name = "Test",
            DurationWeeks = 8,
            IsActive = false
        };

        _programRepo.Setup(r => r.GetByIdAsync(programId, default))
            .ReturnsAsync(program);
        _programRepo.Setup(r => r.DeactivateAllForUserAsync(userId, default))
            .Returns(Task.CompletedTask);
        _programRepo.Setup(r => r.SaveChangesAsync(default))
            .ReturnsAsync(1);

        // Act
        var result = await _handler.Handle(new ActivateProgramCommand(userId, programId), default);

        // Assert
        result.IsSuccess.Should().BeTrue();
        program.IsActive.Should().BeTrue();
        program.ActivatedAt.Should().NotBeNull();
        _programRepo.Verify(r => r.DeactivateAllForUserAsync(userId, default), Times.Once);
        _programRepo.Verify(r => r.Update(program), Times.Once);
    }

    [Fact]
    public async Task Handle_ProgramNotFound_ReturnsFailure()
    {
        // Arrange
        _programRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync((TrainingProgram?)null);

        // Act
        var result = await _handler.Handle(
            new ActivateProgramCommand(Guid.NewGuid(), Guid.NewGuid()), default);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("not found");
    }

    [Fact]
    public async Task Handle_WrongUser_ReturnsFailure()
    {
        // Arrange
        var program = new TrainingProgram
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Name = "Test"
        };

        _programRepo.Setup(r => r.GetByIdAsync(program.Id, default))
            .ReturnsAsync(program);

        // Act (different userId than the program owner)
        var result = await _handler.Handle(
            new ActivateProgramCommand(Guid.NewGuid(), program.Id), default);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("does not belong");
    }

    [Fact]
    public async Task Handle_AlreadyActive_ReturnsFailure()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var program = new TrainingProgram
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = "Test",
            IsActive = true,
            ActivatedAt = DateTime.UtcNow
        };

        _programRepo.Setup(r => r.GetByIdAsync(program.Id, default))
            .ReturnsAsync(program);

        // Act
        var result = await _handler.Handle(
            new ActivateProgramCommand(userId, program.Id), default);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("already active");
    }
}
