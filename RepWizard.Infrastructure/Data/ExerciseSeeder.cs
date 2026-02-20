using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using RepWizard.Core.Entities;
using RepWizard.Core.Enums;

namespace RepWizard.Infrastructure.Data;

/// <summary>
/// Seeds the exercise library from the JSON seed file.
/// Run on API startup if the exercise table is empty.
/// Seed data is defined in RepWizard.Api/Data/Seeds/exercises.json.
/// </summary>
public static class ExerciseSeeder
{
    public static async Task SeedExercisesAsync(AppDbContext context, string seedFilePath)
    {
        if (await context.Exercises.AnyAsync())
            return; // Already seeded

        if (!File.Exists(seedFilePath))
            throw new FileNotFoundException($"Exercise seed file not found: {seedFilePath}");

        var json = await File.ReadAllTextAsync(seedFilePath);
        var seedData = JsonSerializer.Deserialize<List<ExerciseSeedModel>>(json,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        if (seedData == null || seedData.Count == 0)
            return;

        var exercises = seedData.Select(s => new Exercise
        {
            Name = s.Name,
            Description = s.Description,
            Category = ParseEnum<ExerciseCategory>(s.Category),
            PrimaryMuscles = s.PrimaryMuscles.Select(ParseEnum<MuscleGroup>).ToList(),
            SecondaryMuscles = s.SecondaryMuscles.Select(ParseEnum<MuscleGroup>).ToList(),
            Equipment = ParseEnum<Equipment>(s.Equipment),
            Difficulty = ParseEnum<Difficulty>(s.Difficulty),
            IsCompound = s.IsCompound,
            VideoUrl = s.VideoUrl,
            Instructions = s.Instructions.ToList(),
            ResearchNotes = s.ResearchNotes,
            SyncState = SyncState.Synced
        }).ToList();

        await context.Exercises.AddRangeAsync(exercises);
        await context.SaveChangesAsync();
    }

    private static T ParseEnum<T>(string value) where T : struct, Enum
    {
        if (Enum.TryParse<T>(value, ignoreCase: true, out var result))
            return result;

        throw new ArgumentException($"Invalid value '{value}' for enum type {typeof(T).Name}");
    }

    private class ExerciseSeedModel
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public List<string> PrimaryMuscles { get; set; } = new();
        public List<string> SecondaryMuscles { get; set; } = new();
        public string Equipment { get; set; } = string.Empty;
        public string Difficulty { get; set; } = string.Empty;
        public bool IsCompound { get; set; }
        public string? VideoUrl { get; set; }
        public List<string> Instructions { get; set; } = new();
        public string? ResearchNotes { get; set; }
    }
}
