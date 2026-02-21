using FluentAssertions;
using RepWizard.Application.Services;
using RepWizard.Core.Entities;
using RepWizard.Core.Enums;

namespace RepWizard.Tests.Application.Services;

public class ProgramValidatorTests
{
    private readonly ProgramValidator _validator = new();

    #region Helpers

    /// <summary>
    /// Creates a minimal TrainingProgram with the specified number of weeks.
    /// Each non-deload week gets the specified number of training days.
    /// </summary>
    private static TrainingProgram BuildProgram(
        int durationWeeks,
        int trainingDaysPerWeek = 3,
        bool addDeloadWeek = false,
        int? deloadAtWeek = null,
        decimal deloadMultiplier = 0.5m)
    {
        var program = new TrainingProgram
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Name = "Test Program",
            DurationWeeks = durationWeeks
        };

        for (var w = 1; w <= durationWeeks; w++)
        {
            var isDeload = addDeloadWeek && w == (deloadAtWeek ?? durationWeeks);
            var week = new ProgramWeek
            {
                Id = Guid.NewGuid(),
                TrainingProgramId = program.Id,
                WeekNumber = w,
                DeloadWeek = isDeload,
                VolumeMultiplier = isDeload ? deloadMultiplier : 1.0m
            };

            // Add 7 days to the week
            var dayOfWeekValues = Enum.GetValues<DayOfWeekEnum>();
            for (var d = 0; d < dayOfWeekValues.Length; d++)
            {
                var isTrainingDay = d < trainingDaysPerWeek && !isDeload;
                var isDeloadTrainingDay = d < trainingDaysPerWeek && isDeload;

                var day = new ProgramDay
                {
                    Id = Guid.NewGuid(),
                    ProgramWeekId = week.Id,
                    DayOfWeek = dayOfWeekValues[d],
                    RestDay = !(isTrainingDay || isDeloadTrainingDay)
                };

                if (isTrainingDay || isDeloadTrainingDay)
                {
                    day.WorkoutTemplate = BuildDefaultTemplate();
                }

                week.Days.Add(day);
            }

            program.Weeks.Add(week);
        }

        return program;
    }

    /// <summary>
    /// Creates a WorkoutTemplate with a single isolation exercise (low CNS demand) targeting Chest.
    /// Default: 3 sets of the exercise.
    /// </summary>
    private static WorkoutTemplate BuildDefaultTemplate(
        int setCount = 3,
        MuscleGroup primaryMuscle = MuscleGroup.Chest,
        bool isCompound = false,
        ExerciseCategory category = ExerciseCategory.Strength)
    {
        var exercise = new Exercise
        {
            Id = Guid.NewGuid(),
            Name = "Test Exercise",
            IsCompound = isCompound,
            Category = category,
            PrimaryMuscles = new List<MuscleGroup> { primaryMuscle },
            Equipment = Equipment.Dumbbell,
            Difficulty = Difficulty.Intermediate
        };

        var templateExercise = new TemplateExercise
        {
            Id = Guid.NewGuid(),
            ExerciseId = exercise.Id,
            Exercise = exercise,
            OrderIndex = 0,
            SetCount = setCount,
            MinReps = 8,
            MaxReps = 12
        };

        var template = new WorkoutTemplate
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Name = "Test Template"
        };
        template.TemplateExercises.Add(templateExercise);
        templateExercise.WorkoutTemplateId = template.Id;
        templateExercise.WorkoutTemplate = template;

        return template;
    }

    /// <summary>
    /// Creates a high-CNS exercise (compound + Strength/Power category).
    /// </summary>
    private static Exercise BuildHighCnsExercise(string name = "Barbell Squat")
    {
        return new Exercise
        {
            Id = Guid.NewGuid(),
            Name = name,
            IsCompound = true,
            Category = ExerciseCategory.Strength,
            PrimaryMuscles = new List<MuscleGroup> { MuscleGroup.Quads, MuscleGroup.Glutes },
            Equipment = Equipment.Barbell,
            Difficulty = Difficulty.Intermediate
        };
    }

    /// <summary>
    /// Creates a low-CNS exercise (isolation, non-Strength/Power category).
    /// </summary>
    private static Exercise BuildLowCnsExercise(string name = "Bicep Curl", MuscleGroup muscle = MuscleGroup.Biceps)
    {
        return new Exercise
        {
            Id = Guid.NewGuid(),
            Name = name,
            IsCompound = false,
            Category = ExerciseCategory.Flexibility,
            PrimaryMuscles = new List<MuscleGroup> { muscle },
            Equipment = Equipment.Dumbbell,
            Difficulty = Difficulty.Beginner
        };
    }

    /// <summary>
    /// Builds a program with explicit control over each day's exercises for CNS/recovery testing.
    /// </summary>
    private static TrainingProgram BuildProgramWithDayExercises(
        int weeks,
        List<(DayOfWeekEnum day, bool restDay, Exercise? exercise, int setCount)> dayConfig,
        bool addDeloadWeek = false,
        int? deloadAtWeek = null,
        decimal deloadMultiplier = 0.5m)
    {
        var program = new TrainingProgram
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Name = "Custom Program",
            DurationWeeks = weeks
        };

        for (var w = 1; w <= weeks; w++)
        {
            var isDeload = addDeloadWeek && w == (deloadAtWeek ?? weeks);
            var week = new ProgramWeek
            {
                Id = Guid.NewGuid(),
                TrainingProgramId = program.Id,
                WeekNumber = w,
                DeloadWeek = isDeload,
                VolumeMultiplier = isDeload ? deloadMultiplier : 1.0m
            };

            foreach (var (day, restDay, exercise, setCount) in dayConfig)
            {
                var programDay = new ProgramDay
                {
                    Id = Guid.NewGuid(),
                    ProgramWeekId = week.Id,
                    DayOfWeek = day,
                    RestDay = restDay
                };

                if (!restDay && exercise != null)
                {
                    var template = new WorkoutTemplate
                    {
                        Id = Guid.NewGuid(),
                        UserId = program.UserId,
                        Name = $"{exercise.Name} Day"
                    };

                    var te = new TemplateExercise
                    {
                        Id = Guid.NewGuid(),
                        WorkoutTemplateId = template.Id,
                        WorkoutTemplate = template,
                        ExerciseId = exercise.Id,
                        Exercise = exercise,
                        OrderIndex = 0,
                        SetCount = setCount,
                        MinReps = 5,
                        MaxReps = 8
                    };
                    template.TemplateExercises.Add(te);
                    programDay.WorkoutTemplate = template;
                    programDay.WorkoutTemplateId = template.Id;
                }

                week.Days.Add(programDay);
            }

            program.Weeks.Add(week);
        }

        return program;
    }

    #endregion

    #region Deload Rules

    [Fact]
    public void Validate_ProgramUnder4Weeks_NoDeloadRequired()
    {
        // Arrange - 3-week program without any deload week
        var program = BuildProgram(durationWeeks: 3, trainingDaysPerWeek: 3);

        // Act
        var result = _validator.Validate(program, ExperienceLevel.Intermediate);

        // Assert
        result.Violations.Should().NotContain(v => v.Rule == "DeloadRequired");
    }

    [Fact]
    public void Validate_ProgramOver4Weeks_RequiresDeload()
    {
        // Arrange - 5-week program with NO deload week
        var program = BuildProgram(durationWeeks: 5, trainingDaysPerWeek: 3);

        // Act
        var result = _validator.Validate(program, ExperienceLevel.Intermediate);

        // Assert
        result.Violations.Should().Contain(v => v.Rule == "DeloadRequired");
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Validate_ProgramOver4Weeks_WithDeload_IsValid()
    {
        // Arrange - 5-week program with deload at week 5
        var program = BuildProgram(
            durationWeeks: 5,
            trainingDaysPerWeek: 3,
            addDeloadWeek: true,
            deloadAtWeek: 5,
            deloadMultiplier: 0.5m);

        // Act
        var result = _validator.Validate(program, ExperienceLevel.Intermediate);

        // Assert
        result.Violations.Should().NotContain(v => v.Rule == "DeloadRequired");
    }

    [Fact]
    public void Validate_DeloadWeek_InvalidVolumeMultiplier_Fails()
    {
        // Arrange - 5-week program with deload but multiplier too high (0.7 > 0.65)
        var program = BuildProgram(
            durationWeeks: 5,
            trainingDaysPerWeek: 3,
            addDeloadWeek: true,
            deloadAtWeek: 5,
            deloadMultiplier: 0.7m); // Invalid: above 0.65 threshold

        // Act
        var result = _validator.Validate(program, ExperienceLevel.Intermediate);

        // Assert
        result.Violations.Should().Contain(v => v.Rule == "DeloadVolumeInvalid");
    }

    #endregion

    #region Volume Limits

    [Fact]
    public void Validate_BeginnerExceedsMRV_Fails()
    {
        // Arrange - Beginner MRV for a muscle group is 12 sets/week.
        // Create a program where Chest gets 15 sets in a single week.
        var chestExercise = new Exercise
        {
            Id = Guid.NewGuid(),
            Name = "Bench Press",
            IsCompound = false,
            Category = ExerciseCategory.Flexibility, // low CNS to avoid other violations
            PrimaryMuscles = new List<MuscleGroup> { MuscleGroup.Chest },
            Equipment = Equipment.Barbell,
            Difficulty = Difficulty.Beginner
        };

        // 3 training days with 5 sets of chest each = 15 sets (exceeds beginner MRV of 12)
        var dayConfig = new List<(DayOfWeekEnum, bool, Exercise?, int)>
        {
            (DayOfWeekEnum.Monday, false, chestExercise, 5),
            (DayOfWeekEnum.Wednesday, false, chestExercise, 5),
            (DayOfWeekEnum.Friday, false, chestExercise, 5),
            (DayOfWeekEnum.Tuesday, true, null, 0),
            (DayOfWeekEnum.Thursday, true, null, 0),
            (DayOfWeekEnum.Saturday, true, null, 0),
            (DayOfWeekEnum.Sunday, true, null, 0)
        };

        var program = BuildProgramWithDayExercises(weeks: 3, dayConfig: dayConfig);

        // Act
        var result = _validator.Validate(program, ExperienceLevel.Beginner);

        // Assert
        result.Violations.Should().Contain(v =>
            v.Rule == "VolumeExceedsMRV" && v.Message.Contains("Chest"));
    }

    [Fact]
    public void Validate_IntermediateWithinMRV_IsValid()
    {
        // Arrange - Intermediate MRV is 20. Create a program with 15 sets/muscle/week.
        var chestExercise = new Exercise
        {
            Id = Guid.NewGuid(),
            Name = "Bench Press",
            IsCompound = false,
            Category = ExerciseCategory.Flexibility, // low CNS to avoid other violations
            PrimaryMuscles = new List<MuscleGroup> { MuscleGroup.Chest },
            Equipment = Equipment.Barbell,
            Difficulty = Difficulty.Intermediate
        };

        // 3 training days with 5 sets of chest each = 15 sets (under intermediate MRV of 20)
        var dayConfig = new List<(DayOfWeekEnum, bool, Exercise?, int)>
        {
            (DayOfWeekEnum.Monday, false, chestExercise, 5),
            (DayOfWeekEnum.Wednesday, false, chestExercise, 5),
            (DayOfWeekEnum.Friday, false, chestExercise, 5),
            (DayOfWeekEnum.Tuesday, true, null, 0),
            (DayOfWeekEnum.Thursday, true, null, 0),
            (DayOfWeekEnum.Saturday, true, null, 0),
            (DayOfWeekEnum.Sunday, true, null, 0)
        };

        var program = BuildProgramWithDayExercises(weeks: 3, dayConfig: dayConfig);

        // Act
        var result = _validator.Validate(program, ExperienceLevel.Intermediate);

        // Assert
        result.Violations.Should().NotContain(v => v.Rule == "VolumeExceedsMRV");
    }

    [Fact]
    public void ValidateVolumeLimits_NoTemplateData_DoesNotFail()
    {
        // Arrange - Program where WorkoutTemplate is null for training days
        var program = new TrainingProgram
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Name = "Empty Program",
            DurationWeeks = 3
        };

        var week = new ProgramWeek
        {
            Id = Guid.NewGuid(),
            TrainingProgramId = program.Id,
            WeekNumber = 1,
            VolumeMultiplier = 1.0m
        };

        // Training day with no template
        week.Days.Add(new ProgramDay
        {
            Id = Guid.NewGuid(),
            ProgramWeekId = week.Id,
            DayOfWeek = DayOfWeekEnum.Monday,
            RestDay = false,
            WorkoutTemplate = null
        });

        program.Weeks.Add(week);

        var validationResult = new ProgramValidationResult();

        // Act - calling the internal static method directly
        var act = () => ProgramValidator.ValidateVolumeLimits(program, ExperienceLevel.Beginner, validationResult);

        // Assert - should not throw, and no violations
        act.Should().NotThrow();
        validationResult.Violations.Should().NotContain(v => v.Rule == "VolumeExceedsMRV");
    }

    #endregion

    #region CNS Load Rules

    [Fact]
    public void Validate_ThreeConsecutiveHighCnsDays_Fails()
    {
        // Arrange - 3 consecutive days with high-CNS exercises
        var heavyExercise = BuildHighCnsExercise("Heavy Squat");

        var dayConfig = new List<(DayOfWeekEnum, bool, Exercise?, int)>
        {
            (DayOfWeekEnum.Monday, false, heavyExercise, 3),
            (DayOfWeekEnum.Tuesday, false, heavyExercise, 3),
            (DayOfWeekEnum.Wednesday, false, heavyExercise, 3), // 3rd consecutive high-CNS day
            (DayOfWeekEnum.Thursday, true, null, 0),
            (DayOfWeekEnum.Friday, true, null, 0),
            (DayOfWeekEnum.Saturday, true, null, 0),
            (DayOfWeekEnum.Sunday, true, null, 0)
        };

        var program = BuildProgramWithDayExercises(weeks: 3, dayConfig: dayConfig);

        // Act
        var result = _validator.Validate(program, ExperienceLevel.Intermediate);

        // Assert
        result.Violations.Should().Contain(v => v.Rule == "CnsOverload");
    }

    [Fact]
    public void Validate_TwoConsecutiveHighCnsDays_IsValid()
    {
        // Arrange - 2 consecutive high-CNS days followed by rest
        var heavyExercise = BuildHighCnsExercise("Heavy Deadlift");

        var dayConfig = new List<(DayOfWeekEnum, bool, Exercise?, int)>
        {
            (DayOfWeekEnum.Monday, false, heavyExercise, 3),
            (DayOfWeekEnum.Tuesday, false, heavyExercise, 3),
            (DayOfWeekEnum.Wednesday, true, null, 0), // rest breaks the streak
            (DayOfWeekEnum.Thursday, true, null, 0),
            (DayOfWeekEnum.Friday, true, null, 0),
            (DayOfWeekEnum.Saturday, true, null, 0),
            (DayOfWeekEnum.Sunday, true, null, 0)
        };

        var program = BuildProgramWithDayExercises(weeks: 3, dayConfig: dayConfig);

        // Act
        var result = _validator.Validate(program, ExperienceLevel.Intermediate);

        // Assert
        result.Violations.Should().NotContain(v => v.Rule == "CnsOverload");
    }

    #endregion

    #region Beginner Constraints

    [Fact]
    public void Validate_BeginnerOver3Days_Fails()
    {
        // Arrange - Beginner with 4 training days per week
        var lowCnsExercise = BuildLowCnsExercise("Leg Extension", MuscleGroup.Quads);

        var dayConfig = new List<(DayOfWeekEnum, bool, Exercise?, int)>
        {
            (DayOfWeekEnum.Monday, false, lowCnsExercise, 3),
            (DayOfWeekEnum.Tuesday, false, lowCnsExercise, 3),
            (DayOfWeekEnum.Thursday, false, lowCnsExercise, 3),
            (DayOfWeekEnum.Friday, false, lowCnsExercise, 3), // 4th training day
            (DayOfWeekEnum.Wednesday, true, null, 0),
            (DayOfWeekEnum.Saturday, true, null, 0),
            (DayOfWeekEnum.Sunday, true, null, 0)
        };

        var program = BuildProgramWithDayExercises(weeks: 3, dayConfig: dayConfig);

        // Act
        var result = _validator.Validate(program, ExperienceLevel.Beginner);

        // Assert
        result.Violations.Should().Contain(v => v.Rule == "BeginnerOvertraining");
    }

    [Fact]
    public void Validate_BeginnerWith3Days_IsValid()
    {
        // Arrange - Beginner with exactly 3 training days per week
        var lowCnsExercise = BuildLowCnsExercise("Goblet Squat", MuscleGroup.Quads);

        var dayConfig = new List<(DayOfWeekEnum, bool, Exercise?, int)>
        {
            (DayOfWeekEnum.Monday, false, lowCnsExercise, 3),
            (DayOfWeekEnum.Wednesday, false, lowCnsExercise, 3),
            (DayOfWeekEnum.Friday, false, lowCnsExercise, 3),
            (DayOfWeekEnum.Tuesday, true, null, 0),
            (DayOfWeekEnum.Thursday, true, null, 0),
            (DayOfWeekEnum.Saturday, true, null, 0),
            (DayOfWeekEnum.Sunday, true, null, 0)
        };

        var program = BuildProgramWithDayExercises(weeks: 3, dayConfig: dayConfig);

        // Act
        var result = _validator.Validate(program, ExperienceLevel.Beginner);

        // Assert
        result.Violations.Should().NotContain(v => v.Rule == "BeginnerOvertraining");
    }

    #endregion

    #region Recovery Windows

    [Fact]
    public void Validate_SameMuscleConsecutiveDays_Fails()
    {
        // Arrange - Same muscle group (Chest) on consecutive days (Monday + Tuesday)
        var chestExercise = new Exercise
        {
            Id = Guid.NewGuid(),
            Name = "Dumbbell Fly",
            IsCompound = false,
            Category = ExerciseCategory.Flexibility, // low CNS to avoid CnsOverload violation
            PrimaryMuscles = new List<MuscleGroup> { MuscleGroup.Chest },
            Equipment = Equipment.Dumbbell,
            Difficulty = Difficulty.Beginner
        };

        var dayConfig = new List<(DayOfWeekEnum, bool, Exercise?, int)>
        {
            (DayOfWeekEnum.Monday, false, chestExercise, 3),
            (DayOfWeekEnum.Tuesday, false, chestExercise, 3), // Same muscle, consecutive day
            (DayOfWeekEnum.Wednesday, true, null, 0),
            (DayOfWeekEnum.Thursday, true, null, 0),
            (DayOfWeekEnum.Friday, true, null, 0),
            (DayOfWeekEnum.Saturday, true, null, 0),
            (DayOfWeekEnum.Sunday, true, null, 0)
        };

        var program = BuildProgramWithDayExercises(weeks: 3, dayConfig: dayConfig);

        // Act
        var result = _validator.Validate(program, ExperienceLevel.Intermediate);

        // Assert
        result.Violations.Should().Contain(v =>
            v.Rule == "InsufficientRecovery" && v.Message.Contains("Chest"));
    }

    #endregion
}
