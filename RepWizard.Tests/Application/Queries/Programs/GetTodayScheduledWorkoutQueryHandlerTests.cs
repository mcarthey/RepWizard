using FluentAssertions;
using Moq;
using RepWizard.Application.Queries.Programs.GetTodayScheduledWorkout;
using RepWizard.Core.Entities;
using RepWizard.Core.Enums;
using RepWizard.Core.Interfaces.Repositories;

namespace RepWizard.Tests.Application.Queries.Programs;

public class GetTodayScheduledWorkoutQueryHandlerTests
{
    private readonly Mock<ITrainingProgramRepository> _programRepo = new();
    private readonly GetTodayScheduledWorkoutQueryHandler _handler;
    private readonly Guid _userId = Guid.NewGuid();

    public GetTodayScheduledWorkoutQueryHandlerTests()
    {
        _handler = new GetTodayScheduledWorkoutQueryHandler(_programRepo.Object);
    }

    [Fact]
    public async Task Handle_NoActiveProgram_ReturnsNull()
    {
        _programRepo.Setup(r => r.GetActiveForUserAsync(_userId, default))
            .ReturnsAsync((TrainingProgram?)null);

        var result = await _handler.Handle(new GetTodayScheduledWorkoutQuery(_userId), default);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().BeNull();
    }

    [Fact]
    public async Task Handle_ProgramExpired_ReturnsNull()
    {
        // Program activated 20 weeks ago but only 4 weeks long → GetCurrentWeek returns null
        var program = CreateActiveProgram(weeksAgo: 20, durationWeeks: 4);

        _programRepo.Setup(r => r.GetActiveForUserAsync(_userId, default))
            .ReturnsAsync(program);

        var result = await _handler.Handle(new GetTodayScheduledWorkoutQuery(_userId), default);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().BeNull();
    }

    [Fact]
    public async Task Handle_RestDay_ReturnsRestDayDto()
    {
        var todayEnum = GetTodayEnum();
        var program = CreateActiveProgram(weeksAgo: 0, durationWeeks: 8);
        AddDayToWeek(program, todayEnum, restDay: true, focus: null);

        _programRepo.Setup(r => r.GetActiveForUserAsync(_userId, default))
            .ReturnsAsync(program);

        var result = await _handler.Handle(new GetTodayScheduledWorkoutQuery(_userId), default);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.IsRestDay.Should().BeTrue();
        result.Value.ProgramName.Should().Be("Test Program");
        result.Value.CurrentWeekNumber.Should().Be(1);
    }

    [Fact]
    public async Task Handle_TrainingDay_ReturnsFocusAndTemplate()
    {
        var todayEnum = GetTodayEnum();
        var program = CreateActiveProgram(weeksAgo: 0, durationWeeks: 8);
        var template = new WorkoutTemplate
        {
            Id = Guid.NewGuid(),
            Name = "Upper Body A",
            UserId = _userId
        };
        AddDayToWeek(program, todayEnum, restDay: false, focus: "Upper Body", template: template);

        _programRepo.Setup(r => r.GetActiveForUserAsync(_userId, default))
            .ReturnsAsync(program);

        var result = await _handler.Handle(new GetTodayScheduledWorkoutQuery(_userId), default);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.IsRestDay.Should().BeFalse();
        result.Value.Focus.Should().Be("Upper Body");
        result.Value.WorkoutTemplateName.Should().Be("Upper Body A");
        result.Value.WorkoutTemplateId.Should().Be(template.Id);
    }

    [Fact]
    public async Task Handle_NoDayScheduled_TreatsAsRestDay()
    {
        // Program has days scheduled for other days but not today
        var program = CreateActiveProgram(weeksAgo: 0, durationWeeks: 8);
        // Add a day for a DIFFERENT day of the week
        var notToday = GetTodayEnum() == DayOfWeekEnum.Monday
            ? DayOfWeekEnum.Tuesday
            : DayOfWeekEnum.Monday;
        AddDayToWeek(program, notToday, restDay: false, focus: "Legs");

        _programRepo.Setup(r => r.GetActiveForUserAsync(_userId, default))
            .ReturnsAsync(program);

        var result = await _handler.Handle(new GetTodayScheduledWorkoutQuery(_userId), default);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.IsRestDay.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_DeloadWeek_SetsFlag()
    {
        var todayEnum = GetTodayEnum();
        var program = CreateActiveProgram(weeksAgo: 0, durationWeeks: 8);
        program.Weeks.First().DeloadWeek = true;
        program.Weeks.First().VolumeMultiplier = 0.5m;
        AddDayToWeek(program, todayEnum, restDay: false, focus: "Light Upper");

        _programRepo.Setup(r => r.GetActiveForUserAsync(_userId, default))
            .ReturnsAsync(program);

        var result = await _handler.Handle(new GetTodayScheduledWorkoutQuery(_userId), default);

        result.IsSuccess.Should().BeTrue();
        result.Value!.IsDeloadWeek.Should().BeTrue();
    }

    [Theory]
    [InlineData(DayOfWeek.Monday, DayOfWeekEnum.Monday)]
    [InlineData(DayOfWeek.Tuesday, DayOfWeekEnum.Tuesday)]
    [InlineData(DayOfWeek.Wednesday, DayOfWeekEnum.Wednesday)]
    [InlineData(DayOfWeek.Thursday, DayOfWeekEnum.Thursday)]
    [InlineData(DayOfWeek.Friday, DayOfWeekEnum.Friday)]
    [InlineData(DayOfWeek.Saturday, DayOfWeekEnum.Saturday)]
    [InlineData(DayOfWeek.Sunday, DayOfWeekEnum.Sunday)]
    public void ToDayOfWeekEnum_ConvertsCorrectly(DayOfWeek system, DayOfWeekEnum expected)
    {
        GetTodayScheduledWorkoutQueryHandler.ToDayOfWeekEnum(system).Should().Be(expected);
    }

    private TrainingProgram CreateActiveProgram(int weeksAgo, int durationWeeks)
    {
        var program = new TrainingProgram
        {
            Id = Guid.NewGuid(),
            UserId = _userId,
            Name = "Test Program",
            DurationWeeks = durationWeeks,
            GoalDescription = "Get stronger",
            IsActive = true,
            ActivatedAt = DateTime.UtcNow.AddDays(-weeksAgo * 7)
        };

        // Add week 1 (current week for weeksAgo=0)
        var week = new ProgramWeek
        {
            Id = Guid.NewGuid(),
            TrainingProgramId = program.Id,
            WeekNumber = 1,
            VolumeMultiplier = 1.0m
        };
        program.Weeks.Add(week);

        return program;
    }

    private static void AddDayToWeek(
        TrainingProgram program,
        DayOfWeekEnum dayOfWeek,
        bool restDay,
        string? focus,
        WorkoutTemplate? template = null)
    {
        var week = program.Weeks.First();
        week.Days.Add(new ProgramDay
        {
            Id = Guid.NewGuid(),
            ProgramWeekId = week.Id,
            DayOfWeek = dayOfWeek,
            RestDay = restDay,
            Focus = focus,
            WorkoutTemplate = template,
            WorkoutTemplateId = template?.Id
        });
    }

    private static DayOfWeekEnum GetTodayEnum()
    {
        return GetTodayScheduledWorkoutQueryHandler.ToDayOfWeekEnum(DateTime.Now.DayOfWeek);
    }
}
