using FluentAssertions;
using Moq;
using RepWizard.Application.Commands.Programs.CreateTrainingProgram;
using RepWizard.Core.Entities;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Shared.DTOs;

namespace RepWizard.Tests.Application.Commands.Programs;

public class CreateTrainingProgramCommandHandlerTests
{
    private readonly Mock<ITrainingProgramRepository> _programRepo = new();
    private readonly CreateTrainingProgramCommandHandler _handler;

    public CreateTrainingProgramCommandHandlerTests()
    {
        _handler = new CreateTrainingProgramCommandHandler(_programRepo.Object);
    }

    [Fact]
    public async Task Handle_ValidCommand_CreatesProgramWithWeeks()
    {
        // Arrange
        _programRepo.Setup(r => r.AddAsync(It.IsAny<TrainingProgram>(), default))
            .Returns(Task.CompletedTask);
        _programRepo.Setup(r => r.SaveChangesAsync(default))
            .ReturnsAsync(1);

        var command = new CreateTrainingProgramCommand(
            UserId: Guid.NewGuid(),
            Name: "Test Program",
            DurationWeeks: 4,
            GoalDescription: "Get stronger",
            GeneratedByAi: false,
            AiReasoning: null,
            ActivateImmediately: false,
            Days: new List<ProgramDayInput>
            {
                new() { DayOfWeek = "Monday", RestDay = false, Focus = "Upper" },
                new() { DayOfWeek = "Wednesday", RestDay = false, Focus = "Lower" },
                new() { DayOfWeek = "Friday", RestDay = false, Focus = "Full Body" }
            });

        // Act
        var result = await _handler.Handle(command, default);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Name.Should().Be("Test Program");
        result.Value.DurationWeeks.Should().Be(4);
        result.Value.Weeks.Should().HaveCount(4);

        // Last week should be deload (4+ weeks rule)
        result.Value.Weeks.Last().DeloadWeek.Should().BeTrue();
        result.Value.Weeks.Last().VolumeMultiplier.Should().Be(0.5m);

        _programRepo.Verify(r => r.AddAsync(It.IsAny<TrainingProgram>(), default), Times.Once);
        _programRepo.Verify(r => r.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task Handle_ActivateImmediately_DeactivatesOthersAndActivates()
    {
        // Arrange
        _programRepo.Setup(r => r.DeactivateAllForUserAsync(It.IsAny<Guid>(), default))
            .Returns(Task.CompletedTask);
        _programRepo.Setup(r => r.AddAsync(It.IsAny<TrainingProgram>(), default))
            .Returns(Task.CompletedTask);
        _programRepo.Setup(r => r.SaveChangesAsync(default))
            .ReturnsAsync(1);

        var userId = Guid.NewGuid();
        var command = new CreateTrainingProgramCommand(
            UserId: userId,
            Name: "Active Program",
            DurationWeeks: 8,
            GoalDescription: "Build muscle",
            GeneratedByAi: false,
            AiReasoning: null,
            ActivateImmediately: true,
            Days: new List<ProgramDayInput>
            {
                new() { DayOfWeek = "Monday", RestDay = false, Focus = "Push" }
            });

        // Act
        var result = await _handler.Handle(command, default);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.IsActive.Should().BeTrue();
        result.Value.ActivatedAt.Should().NotBeNull();

        _programRepo.Verify(r => r.DeactivateAllForUserAsync(userId, default), Times.Once);
    }

    [Fact]
    public async Task Handle_ShortProgram_NoDeloadWeek()
    {
        // Arrange
        _programRepo.Setup(r => r.AddAsync(It.IsAny<TrainingProgram>(), default))
            .Returns(Task.CompletedTask);
        _programRepo.Setup(r => r.SaveChangesAsync(default))
            .ReturnsAsync(1);

        var command = new CreateTrainingProgramCommand(
            UserId: Guid.NewGuid(),
            Name: "Short Program",
            DurationWeeks: 3,
            GoalDescription: "Quick cycle",
            GeneratedByAi: false,
            AiReasoning: null,
            ActivateImmediately: false,
            Days: new List<ProgramDayInput>
            {
                new() { DayOfWeek = "Monday", RestDay = false, Focus = "Full Body" }
            });

        // Act
        var result = await _handler.Handle(command, default);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Weeks.Should().HaveCount(3);
        result.Value.Weeks.Should().AllSatisfy(w => w.DeloadWeek.Should().BeFalse());
    }

    [Fact]
    public async Task Handle_WithExercises_CreatesWorkoutTemplates()
    {
        // Arrange
        _programRepo.Setup(r => r.AddAsync(It.IsAny<TrainingProgram>(), default))
            .Returns(Task.CompletedTask);
        _programRepo.Setup(r => r.SaveChangesAsync(default))
            .ReturnsAsync(1);

        var exerciseId = Guid.NewGuid();
        var command = new CreateTrainingProgramCommand(
            UserId: Guid.NewGuid(),
            Name: "With Exercises",
            DurationWeeks: 4,
            GoalDescription: "Test",
            GeneratedByAi: false,
            AiReasoning: null,
            ActivateImmediately: false,
            Days: new List<ProgramDayInput>
            {
                new()
                {
                    DayOfWeek = "Monday",
                    RestDay = false,
                    Focus = "Push",
                    Exercises = new List<ProgramExerciseInput>
                    {
                        new() { ExerciseId = exerciseId, OrderIndex = 0, SetCount = 3, MinReps = 8, MaxReps = 12 }
                    }
                }
            });

        // Act
        var result = await _handler.Handle(command, default);

        // Assert
        result.IsSuccess.Should().BeTrue();
        // Each week's Monday should have a WorkoutTemplate
        var firstWeekMonday = result.Value!.Weeks.First().Days.First();
        firstWeekMonday.WorkoutTemplateName.Should().Contain("Push");

        // Verify MarkAsNew was called for child entities
        _programRepo.Verify(r => r.MarkAsNew(It.IsAny<BaseEntity>()), Times.AtLeastOnce);
    }
}
