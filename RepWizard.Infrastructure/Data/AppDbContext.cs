using Microsoft.EntityFrameworkCore;
using RepWizard.Core.Entities;
using RepWizard.Core.Enums;
using System.Text.Json;

namespace RepWizard.Infrastructure.Data;

/// <summary>
/// EF Core DbContext for RepWizard. Supports both SQLite (MAUI client) and PostgreSQL (API server)
/// via provider-specific configuration passed at registration time.
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Exercise> Exercises => Set<Exercise>();
    public DbSet<WorkoutTemplate> WorkoutTemplates => Set<WorkoutTemplate>();
    public DbSet<TemplateExercise> TemplateExercises => Set<TemplateExercise>();
    public DbSet<WorkoutSession> WorkoutSessions => Set<WorkoutSession>();
    public DbSet<SessionExercise> SessionExercises => Set<SessionExercise>();
    public DbSet<ExerciseSet> ExerciseSets => Set<ExerciseSet>();
    public DbSet<TrainingProgram> TrainingPrograms => Set<TrainingProgram>();
    public DbSet<ProgramWeek> ProgramWeeks => Set<ProgramWeek>();
    public DbSet<ProgramDay> ProgramDays => Set<ProgramDay>();
    public DbSet<BodyMeasurement> BodyMeasurements => Set<BodyMeasurement>();
    public DbSet<AiConversation> AiConversations => Set<AiConversation>();
    public DbSet<AiMessage> AiMessages => Set<AiMessage>();
    public DbSet<ConflictLog> ConflictLogs => Set<ConflictLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply global soft-delete filter to all BaseEntity types
        modelBuilder.Entity<User>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Exercise>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<WorkoutTemplate>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<TemplateExercise>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<WorkoutSession>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<SessionExercise>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<ExerciseSet>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<TrainingProgram>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<ProgramWeek>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<ProgramDay>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<BodyMeasurement>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<AiConversation>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<AiMessage>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<ConflictLog>().HasQueryFilter(e => !e.IsDeleted);

        // User configuration
        modelBuilder.Entity<User>(b =>
        {
            b.HasKey(u => u.Id);
            b.HasIndex(u => u.Email).IsUnique();
            b.Property(u => u.Email).HasMaxLength(256).IsRequired();
            b.Property(u => u.Name).HasMaxLength(100).IsRequired();
            b.Property(u => u.PasswordHash).HasMaxLength(256).IsRequired();
            b.Property(u => u.RefreshToken).HasMaxLength(256);
            b.Property(u => u.MedicalNotes).HasMaxLength(2000);
            b.Property(u => u.HeightCm).HasPrecision(5, 2);
            b.Property(u => u.WeightKg).HasPrecision(6, 2);

            // Training goal fields
            b.Property(u => u.LongTermGoalText).HasMaxLength(500);
            b.Property(u => u.ShortTermFocusText).HasMaxLength(500);
            b.Property(u => u.AvailableEquipment).HasMaxLength(500);
            b.Property(u => u.MovementLimitations).HasMaxLength(1000);
        });

        // ConflictLog configuration
        modelBuilder.Entity<ConflictLog>(b =>
        {
            b.HasKey(c => c.Id);
            b.HasIndex(c => c.UserId);
            b.HasIndex(c => new { c.EntityType, c.EntityId });
            b.Property(c => c.EntityType).HasMaxLength(100);
            b.Property(c => c.Resolution).HasMaxLength(50);
            b.HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // Exercise configuration - serialize collections as JSON
        modelBuilder.Entity<Exercise>(b =>
        {
            b.HasKey(e => e.Id);
            b.Property(e => e.Name).HasMaxLength(200).IsRequired();
            b.Property(e => e.Description).HasMaxLength(2000);
            b.Property(e => e.VideoUrl).HasMaxLength(500);
            b.Property(e => e.ResearchNotes).HasMaxLength(4000);

            // Store MuscleGroup lists as JSON
            b.Property(e => e.PrimaryMuscles)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<MuscleGroup>>(v, (JsonSerializerOptions?)null) ?? new List<MuscleGroup>()
                );
            b.Property(e => e.SecondaryMuscles)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<MuscleGroup>>(v, (JsonSerializerOptions?)null) ?? new List<MuscleGroup>()
                );

            // Store Instructions as JSON
            b.Property(e => e.Instructions)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>()
                );
        });

        // WorkoutTemplate configuration
        modelBuilder.Entity<WorkoutTemplate>(b =>
        {
            b.HasKey(t => t.Id);
            b.Property(t => t.Name).HasMaxLength(200).IsRequired();
            b.Property(t => t.Description).HasMaxLength(2000);
            b.Property(t => t.Tags)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>()
                );
            b.HasOne(t => t.User)
                .WithMany(u => u.WorkoutTemplates)
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // TemplateExercise configuration
        modelBuilder.Entity<TemplateExercise>(b =>
        {
            b.HasKey(te => te.Id);
            b.Property(te => te.Notes).HasMaxLength(1000);
            b.HasOne(te => te.WorkoutTemplate)
                .WithMany(t => t.TemplateExercises)
                .HasForeignKey(te => te.WorkoutTemplateId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(te => te.Exercise)
                .WithMany(e => e.TemplateExercises)
                .HasForeignKey(te => te.ExerciseId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // WorkoutSession configuration
        modelBuilder.Entity<WorkoutSession>(b =>
        {
            b.HasKey(s => s.Id);
            b.Property(s => s.Notes).HasMaxLength(2000);
            b.HasOne(s => s.User)
                .WithMany(u => u.WorkoutSessions)
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(s => s.Template)
                .WithMany()
                .HasForeignKey(s => s.TemplateId)
                .OnDelete(DeleteBehavior.NoAction)
                .IsRequired(false);
        });

        // SessionExercise configuration
        modelBuilder.Entity<SessionExercise>(b =>
        {
            b.HasKey(se => se.Id);
            b.Property(se => se.Notes).HasMaxLength(1000);
            b.HasOne(se => se.WorkoutSession)
                .WithMany(s => s.SessionExercises)
                .HasForeignKey(se => se.WorkoutSessionId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(se => se.Exercise)
                .WithMany(e => e.SessionExercises)
                .HasForeignKey(se => se.ExerciseId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ExerciseSet configuration
        modelBuilder.Entity<ExerciseSet>(b =>
        {
            b.HasKey(s => s.Id);
            b.Property(s => s.WeightKg).HasPrecision(6, 2);
            b.Property(s => s.RPE).HasPrecision(3, 1);
            b.HasOne(s => s.SessionExercise)
                .WithMany(se => se.Sets)
                .HasForeignKey(s => s.SessionExerciseId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // TrainingProgram configuration
        modelBuilder.Entity<TrainingProgram>(b =>
        {
            b.HasKey(p => p.Id);
            b.Property(p => p.Name).HasMaxLength(200).IsRequired();
            b.Property(p => p.GoalDescription).HasMaxLength(2000);
            b.HasOne(p => p.User)
                .WithMany(u => u.TrainingPrograms)
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ProgramWeek configuration
        modelBuilder.Entity<ProgramWeek>(b =>
        {
            b.HasKey(w => w.Id);
            b.Property(w => w.VolumeMultiplier).HasPrecision(4, 2);
            b.HasOne(w => w.TrainingProgram)
                .WithMany(p => p.Weeks)
                .HasForeignKey(w => w.TrainingProgramId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ProgramDay configuration
        modelBuilder.Entity<ProgramDay>(b =>
        {
            b.HasKey(d => d.Id);
            b.Property(d => d.Focus).HasMaxLength(200);
            b.HasOne(d => d.ProgramWeek)
                .WithMany(w => w.Days)
                .HasForeignKey(d => d.ProgramWeekId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(d => d.WorkoutTemplate)
                .WithMany(t => t.ProgramDays)
                .HasForeignKey(d => d.WorkoutTemplateId)
                .OnDelete(DeleteBehavior.NoAction)
                .IsRequired(false);
        });

        // BodyMeasurement configuration
        modelBuilder.Entity<BodyMeasurement>(b =>
        {
            b.HasKey(m => m.Id);
            b.Property(m => m.WeightKg).HasPrecision(6, 2);
            b.Property(m => m.BodyFatPercent).HasPrecision(5, 2);
            b.Property(m => m.MuscleKg).HasPrecision(6, 2);
            b.Property(m => m.MeasurementNotes).HasMaxLength(2000);
            b.Property(m => m.Photos)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>()
                );
            b.HasOne(m => m.User)
                .WithMany(u => u.BodyMeasurements)
                .HasForeignKey(m => m.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // AiConversation configuration
        modelBuilder.Entity<AiConversation>(b =>
        {
            b.HasKey(c => c.Id);
            b.Property(c => c.Title).HasMaxLength(200);
            b.HasOne(c => c.User)
                .WithMany(u => u.AiConversations)
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // AiMessage configuration
        modelBuilder.Entity<AiMessage>(b =>
        {
            b.HasKey(m => m.Id);
            b.HasOne(m => m.Conversation)
                .WithMany(c => c.Messages)
                .HasForeignKey(m => m.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Check constraints — SQL Server only (defense-in-depth behind FluentValidation).
        // SQLite (tests + MAUI client) doesn't support all SQL Server syntax in check constraints,
        // and FluentValidation already enforces these ranges at the application layer.
        if (Database.IsSqlServer())
        {
            modelBuilder.Entity<ExerciseSet>(b =>
            {
                b.ToTable(t =>
                {
                    t.HasCheckConstraint("CK_ExerciseSet_Reps", "[Reps] > 0");
                    t.HasCheckConstraint("CK_ExerciseSet_SetNumber", "[SetNumber] > 0");
                    t.HasCheckConstraint("CK_ExerciseSet_RPE", "[RPE] IS NULL OR ([RPE] >= 1 AND [RPE] <= 10)");
                    t.HasCheckConstraint("CK_ExerciseSet_RIR", "[RepsInReserve] IS NULL OR ([RepsInReserve] >= 0 AND [RepsInReserve] <= 10)");
                    t.HasCheckConstraint("CK_ExerciseSet_WeightKg", "[WeightKg] IS NULL OR [WeightKg] >= 0");
                });
            });

            modelBuilder.Entity<TemplateExercise>(b =>
            {
                b.ToTable(t =>
                {
                    t.HasCheckConstraint("CK_TemplateExercise_SetCount", "[SetCount] > 0");
                    t.HasCheckConstraint("CK_TemplateExercise_MinReps", "[MinReps] > 0");
                    t.HasCheckConstraint("CK_TemplateExercise_MaxReps", "[MaxReps] >= [MinReps]");
                    t.HasCheckConstraint("CK_TemplateExercise_RestSeconds", "[RestSeconds] >= 0");
                });
            });

            modelBuilder.Entity<ProgramWeek>(b =>
            {
                b.ToTable(t =>
                {
                    t.HasCheckConstraint("CK_ProgramWeek_WeekNumber", "[WeekNumber] > 0");
                    t.HasCheckConstraint("CK_ProgramWeek_VolumeMultiplier", "[VolumeMultiplier] >= 0 AND [VolumeMultiplier] <= 2");
                });
            });

            modelBuilder.Entity<BodyMeasurement>(b =>
            {
                b.ToTable(t =>
                {
                    t.HasCheckConstraint("CK_BodyMeasurement_WeightKg", "[WeightKg] IS NULL OR ([WeightKg] >= 0 AND [WeightKg] <= 500)");
                    t.HasCheckConstraint("CK_BodyMeasurement_BodyFatPercent", "[BodyFatPercent] IS NULL OR ([BodyFatPercent] >= 3 AND [BodyFatPercent] <= 60)");
                });
            });
        }
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Update audit fields before saving
        var now = DateTime.UtcNow;
        foreach (var entry in ChangeTracker.Entries<Core.Entities.BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = now;
                    entry.Entity.UpdatedAt = now;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = now;
                    // Mark as modified for sync if currently synced
                    if (entry.Entity.SyncState == SyncState.Synced)
                        entry.Entity.SyncState = SyncState.Modified;
                    break;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
