using System.ComponentModel;
using System.Runtime.Serialization;

namespace RepWizard.Core.Enums;

public enum FitnessGoal
{
    [EnumMember(Value = "strength_gain")]
    [Description("Strength Gain")]
    StrengthGain = 0,

    [EnumMember(Value = "muscle_hypertrophy")]
    [Description("Muscle Hypertrophy")]
    MuscleHypertrophy = 1,

    [EnumMember(Value = "fat_loss")]
    [Description("Fat Loss")]
    FatLoss = 2,

    [EnumMember(Value = "general_fitness")]
    [Description("General Fitness")]
    GeneralFitness = 3,

    [EnumMember(Value = "endurance")]
    [Description("Endurance")]
    Endurance = 4,

    [EnumMember(Value = "power_and_athletics")]
    [Description("Power and Athletics")]
    PowerAndAthletics = 5,

    [EnumMember(Value = "rehabilitation")]
    [Description("Rehabilitation")]
    Rehabilitation = 6
}

public enum ExperienceLevel
{
    [EnumMember(Value = "beginner")]
    [Description("Beginner (0–6 months)")]
    Beginner = 0,

    [EnumMember(Value = "novice")]
    [Description("Novice (6–18 months)")]
    Novice = 1,

    [EnumMember(Value = "intermediate")]
    [Description("Intermediate (1.5–3 years)")]
    Intermediate = 2,

    [EnumMember(Value = "advanced")]
    [Description("Advanced (3–5 years)")]
    Advanced = 3,

    [EnumMember(Value = "elite")]
    [Description("Elite (5+ years)")]
    Elite = 4
}

public enum ExerciseCategory
{
    [EnumMember(Value = "strength")]
    [Description("Strength")]
    Strength = 0,

    [EnumMember(Value = "cardio")]
    [Description("Cardio")]
    Cardio = 1,

    [EnumMember(Value = "flexibility")]
    [Description("Flexibility")]
    Flexibility = 2,

    [EnumMember(Value = "balance")]
    [Description("Balance")]
    Balance = 3,

    [EnumMember(Value = "power")]
    [Description("Power")]
    Power = 4,

    [EnumMember(Value = "rehabilitation")]
    [Description("Rehabilitation")]
    Rehabilitation = 5,

    [EnumMember(Value = "warmup")]
    [Description("Warmup")]
    Warmup = 6,

    [EnumMember(Value = "cooldown")]
    [Description("Cooldown")]
    Cooldown = 7
}

public enum Equipment
{
    [EnumMember(Value = "barbell")]
    [Description("Barbell")]
    Barbell = 0,

    [EnumMember(Value = "dumbbell")]
    [Description("Dumbbell")]
    Dumbbell = 1,

    [EnumMember(Value = "machine")]
    [Description("Machine")]
    Machine = 2,

    [EnumMember(Value = "cable")]
    [Description("Cable")]
    Cable = 3,

    [EnumMember(Value = "bodyweight")]
    [Description("Bodyweight")]
    Bodyweight = 4,

    [EnumMember(Value = "kettlebell")]
    [Description("Kettlebell")]
    Kettlebell = 5,

    [EnumMember(Value = "bands")]
    [Description("Resistance Bands")]
    Bands = 6,

    [EnumMember(Value = "trx")]
    [Description("TRX / Suspension")]
    TRX = 7,

    [EnumMember(Value = "none")]
    [Description("No Equipment")]
    None = 8
}

public enum SetType
{
    [EnumMember(Value = "warmup")]
    [Description("Warm-up Set")]
    Warmup = 0,

    [EnumMember(Value = "working")]
    [Description("Working Set")]
    Working = 1,

    [EnumMember(Value = "dropset")]
    [Description("Drop Set")]
    Dropset = 2,

    [EnumMember(Value = "failure_set")]
    [Description("Failure Set")]
    FailureSet = 3,

    [EnumMember(Value = "force_rep")]
    [Description("Force Rep")]
    ForceRep = 4,

    [EnumMember(Value = "negative_only")]
    [Description("Negative Only")]
    NegativeOnly = 5,

    [EnumMember(Value = "isometric_hold")]
    [Description("Isometric Hold")]
    IsometricHold = 6
}

public enum ProgressionRule
{
    [EnumMember(Value = "linear_load")]
    [Description("Linear Load Progression")]
    LinearLoad = 0,

    [EnumMember(Value = "double_progression")]
    [Description("Double Progression (Reps then Load)")]
    DoubleProgression = 1,

    [EnumMember(Value = "rpe_based")]
    [Description("RPE Based")]
    RPEBased = 2,

    [EnumMember(Value = "percentage_of_max")]
    [Description("Percentage of 1RM")]
    PercentageOfMax = 3,

    [EnumMember(Value = "autoregulated")]
    [Description("Autoregulated")]
    Autoregulated = 4,

    [EnumMember(Value = "deload")]
    [Description("Deload")]
    Deload = 5
}

public enum MuscleGroup
{
    [EnumMember(Value = "chest")]
    [Description("Chest")]
    Chest = 0,

    [EnumMember(Value = "back")]
    [Description("Back")]
    Back = 1,

    [EnumMember(Value = "shoulders")]
    [Description("Shoulders")]
    Shoulders = 2,

    [EnumMember(Value = "biceps")]
    [Description("Biceps")]
    Biceps = 3,

    [EnumMember(Value = "triceps")]
    [Description("Triceps")]
    Triceps = 4,

    [EnumMember(Value = "forearms")]
    [Description("Forearms")]
    Forearms = 5,

    [EnumMember(Value = "quads")]
    [Description("Quadriceps")]
    Quads = 6,

    [EnumMember(Value = "hamstrings")]
    [Description("Hamstrings")]
    Hamstrings = 7,

    [EnumMember(Value = "glutes")]
    [Description("Glutes")]
    Glutes = 8,

    [EnumMember(Value = "calves")]
    [Description("Calves")]
    Calves = 9,

    [EnumMember(Value = "core")]
    [Description("Core")]
    Core = 10,

    [EnumMember(Value = "full_body")]
    [Description("Full Body")]
    FullBody = 11,

    [EnumMember(Value = "traps")]
    [Description("Trapezius")]
    Traps = 12,

    [EnumMember(Value = "lats")]
    [Description("Latissimus Dorsi")]
    Lats = 13
}

public enum SyncState
{
    [EnumMember(Value = "new")]
    [Description("New (not yet synced)")]
    New = 0,

    [EnumMember(Value = "modified")]
    [Description("Modified (pending sync)")]
    Modified = 1,

    [EnumMember(Value = "synced")]
    [Description("Synced")]
    Synced = 2,

    [EnumMember(Value = "conflict")]
    [Description("Conflict")]
    Conflict = 3
}

public enum MessageRole
{
    [EnumMember(Value = "user")]
    [Description("User")]
    User = 0,

    [EnumMember(Value = "assistant")]
    [Description("Assistant")]
    Assistant = 1,

    [EnumMember(Value = "system")]
    [Description("System")]
    System = 2
}

public enum DayOfWeekEnum
{
    [EnumMember(Value = "monday")]
    [Description("Monday")]
    Monday = 1,

    [EnumMember(Value = "tuesday")]
    [Description("Tuesday")]
    Tuesday = 2,

    [EnumMember(Value = "wednesday")]
    [Description("Wednesday")]
    Wednesday = 3,

    [EnumMember(Value = "thursday")]
    [Description("Thursday")]
    Thursday = 4,

    [EnumMember(Value = "friday")]
    [Description("Friday")]
    Friday = 5,

    [EnumMember(Value = "saturday")]
    [Description("Saturday")]
    Saturday = 6,

    [EnumMember(Value = "sunday")]
    [Description("Sunday")]
    Sunday = 7
}

public enum Difficulty
{
    [EnumMember(Value = "beginner")]
    [Description("Beginner")]
    Beginner = 0,

    [EnumMember(Value = "intermediate")]
    [Description("Intermediate")]
    Intermediate = 1,

    [EnumMember(Value = "advanced")]
    [Description("Advanced")]
    Advanced = 2,

    [EnumMember(Value = "elite")]
    [Description("Elite")]
    Elite = 3
}
