using RepWizard.Core.Enums;

namespace RepWizard.Core.Entities;

/// <summary>
/// User profile entity containing personal information and fitness goals.
/// </summary>
public class User : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiresAt { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public decimal? HeightCm { get; set; }
    public decimal? WeightKg { get; set; }
    public FitnessGoal FitnessGoal { get; set; } = FitnessGoal.GeneralFitness;
    public ExperienceLevel ExperienceLevel { get; set; } = ExperienceLevel.Beginner;
    public string? MedicalNotes { get; set; }

    // Navigation properties
    public ICollection<WorkoutSession> WorkoutSessions { get; set; } = new List<WorkoutSession>();
    public ICollection<WorkoutTemplate> WorkoutTemplates { get; set; } = new List<WorkoutTemplate>();
    public ICollection<TrainingProgram> TrainingPrograms { get; set; } = new List<TrainingProgram>();
    public ICollection<BodyMeasurement> BodyMeasurements { get; set; } = new List<BodyMeasurement>();
    public ICollection<AiConversation> AiConversations { get; set; } = new List<AiConversation>();

    /// <summary>
    /// Calculates the user's age in years from DateOfBirth.
    /// Returns null if DateOfBirth is not set.
    /// </summary>
    public int? CalculateAge()
    {
        if (DateOfBirth == null) return null;

        var today = DateTime.Today;
        var age = today.Year - DateOfBirth.Value.Year;
        if (DateOfBirth.Value.Date > today.AddYears(-age)) age--;
        return age;
    }

    /// <summary>
    /// Returns a display-friendly description of the user's fitness goal.
    /// </summary>
    public string GetGoalDescription() => FitnessGoal switch
    {
        FitnessGoal.StrengthGain => "Building maximal strength through progressive overload",
        FitnessGoal.MuscleHypertrophy => "Maximizing muscle size through volume and mechanical tension",
        FitnessGoal.FatLoss => "Reducing body fat while preserving lean mass",
        FitnessGoal.GeneralFitness => "Improving overall health and functional fitness",
        FitnessGoal.Endurance => "Developing cardiovascular and muscular endurance",
        FitnessGoal.PowerAndAthletics => "Developing explosive power and athletic performance",
        FitnessGoal.Rehabilitation => "Recovering from injury with corrective programming",
        _ => "General fitness improvement"
    };
}
