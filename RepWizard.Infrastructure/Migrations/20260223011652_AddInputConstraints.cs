using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RepWizard.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddInputConstraints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "WorkoutTemplates",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Notes",
                table: "WorkoutSessions",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "MedicalNotes",
                table: "Users",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "GoalDescription",
                table: "TrainingPrograms",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Notes",
                table: "TemplateExercises",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Notes",
                table: "SessionExercises",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Focus",
                table: "ProgramDays",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "VideoUrl",
                table: "Exercises",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ResearchNotes",
                table: "Exercises",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Resolution",
                table: "ConflictLogs",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "EntityType",
                table: "ConflictLogs",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AlterColumn<string>(
                name: "MeasurementNotes",
                table: "BodyMeasurements",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_TemplateExercise_MaxReps",
                table: "TemplateExercises",
                sql: "[MaxReps] >= [MinReps]");

            migrationBuilder.AddCheckConstraint(
                name: "CK_TemplateExercise_MinReps",
                table: "TemplateExercises",
                sql: "[MinReps] > 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_TemplateExercise_RestSeconds",
                table: "TemplateExercises",
                sql: "[RestSeconds] >= 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_TemplateExercise_SetCount",
                table: "TemplateExercises",
                sql: "[SetCount] > 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_ProgramWeek_VolumeMultiplier",
                table: "ProgramWeeks",
                sql: "[VolumeMultiplier] >= 0 AND [VolumeMultiplier] <= 2");

            migrationBuilder.AddCheckConstraint(
                name: "CK_ProgramWeek_WeekNumber",
                table: "ProgramWeeks",
                sql: "[WeekNumber] > 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_ExerciseSet_Reps",
                table: "ExerciseSets",
                sql: "[Reps] > 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_ExerciseSet_RIR",
                table: "ExerciseSets",
                sql: "[RepsInReserve] IS NULL OR ([RepsInReserve] >= 0 AND [RepsInReserve] <= 10)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_ExerciseSet_RPE",
                table: "ExerciseSets",
                sql: "[RPE] IS NULL OR ([RPE] >= 1 AND [RPE] <= 10)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_ExerciseSet_SetNumber",
                table: "ExerciseSets",
                sql: "[SetNumber] > 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_ExerciseSet_WeightKg",
                table: "ExerciseSets",
                sql: "[WeightKg] IS NULL OR [WeightKg] >= 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_BodyMeasurement_BodyFatPercent",
                table: "BodyMeasurements",
                sql: "[BodyFatPercent] IS NULL OR ([BodyFatPercent] >= 3 AND [BodyFatPercent] <= 60)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_BodyMeasurement_WeightKg",
                table: "BodyMeasurements",
                sql: "[WeightKg] IS NULL OR ([WeightKg] >= 0 AND [WeightKg] <= 500)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_TemplateExercise_MaxReps",
                table: "TemplateExercises");

            migrationBuilder.DropCheckConstraint(
                name: "CK_TemplateExercise_MinReps",
                table: "TemplateExercises");

            migrationBuilder.DropCheckConstraint(
                name: "CK_TemplateExercise_RestSeconds",
                table: "TemplateExercises");

            migrationBuilder.DropCheckConstraint(
                name: "CK_TemplateExercise_SetCount",
                table: "TemplateExercises");

            migrationBuilder.DropCheckConstraint(
                name: "CK_ProgramWeek_VolumeMultiplier",
                table: "ProgramWeeks");

            migrationBuilder.DropCheckConstraint(
                name: "CK_ProgramWeek_WeekNumber",
                table: "ProgramWeeks");

            migrationBuilder.DropCheckConstraint(
                name: "CK_ExerciseSet_Reps",
                table: "ExerciseSets");

            migrationBuilder.DropCheckConstraint(
                name: "CK_ExerciseSet_RIR",
                table: "ExerciseSets");

            migrationBuilder.DropCheckConstraint(
                name: "CK_ExerciseSet_RPE",
                table: "ExerciseSets");

            migrationBuilder.DropCheckConstraint(
                name: "CK_ExerciseSet_SetNumber",
                table: "ExerciseSets");

            migrationBuilder.DropCheckConstraint(
                name: "CK_ExerciseSet_WeightKg",
                table: "ExerciseSets");

            migrationBuilder.DropCheckConstraint(
                name: "CK_BodyMeasurement_BodyFatPercent",
                table: "BodyMeasurements");

            migrationBuilder.DropCheckConstraint(
                name: "CK_BodyMeasurement_WeightKg",
                table: "BodyMeasurements");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "WorkoutTemplates",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(2000)",
                oldMaxLength: 2000);

            migrationBuilder.AlterColumn<string>(
                name: "Notes",
                table: "WorkoutSessions",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(2000)",
                oldMaxLength: 2000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "MedicalNotes",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(2000)",
                oldMaxLength: 2000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "GoalDescription",
                table: "TrainingPrograms",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(2000)",
                oldMaxLength: 2000);

            migrationBuilder.AlterColumn<string>(
                name: "Notes",
                table: "TemplateExercises",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Notes",
                table: "SessionExercises",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Focus",
                table: "ProgramDays",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "VideoUrl",
                table: "Exercises",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ResearchNotes",
                table: "Exercises",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(4000)",
                oldMaxLength: 4000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Resolution",
                table: "ConflictLogs",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<string>(
                name: "EntityType",
                table: "ConflictLogs",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "MeasurementNotes",
                table: "BodyMeasurements",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(2000)",
                oldMaxLength: 2000,
                oldNullable: true);
        }
    }
}
