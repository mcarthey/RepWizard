using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RepWizard.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserGoalFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AvailableDaysPerWeek",
                table: "Users",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AvailableEquipment",
                table: "Users",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LongTermGoalMonths",
                table: "Users",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LongTermGoalText",
                table: "Users",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MovementLimitations",
                table: "Users",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SessionLengthMinutes",
                table: "Users",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ShortTermFocusText",
                table: "Users",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ShortTermFocusWeeks",
                table: "Users",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AvailableDaysPerWeek",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "AvailableEquipment",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "LongTermGoalMonths",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "LongTermGoalText",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "MovementLimitations",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SessionLengthMinutes",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ShortTermFocusText",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ShortTermFocusWeeks",
                table: "Users");
        }
    }
}
