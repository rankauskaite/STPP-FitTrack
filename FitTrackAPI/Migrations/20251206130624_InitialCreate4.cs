using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FitTrackAPI.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate4 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CommonMistakes",
                table: "ExerciseTemplates",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Difficulty",
                table: "ExerciseTemplates",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Equipment",
                table: "ExerciseTemplates",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExecutionSteps",
                table: "ExerciseTemplates",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HowToImageUrl",
                table: "ExerciseTemplates",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Mechanics",
                table: "ExerciseTemplates",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "MusclesImageUrl",
                table: "ExerciseTemplates",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PrimaryMuscles",
                table: "ExerciseTemplates",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SecondaryMuscles",
                table: "ExerciseTemplates",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ShortDescription",
                table: "ExerciseTemplates",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Tips",
                table: "ExerciseTemplates",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "ExerciseTemplates",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "VideoUrl",
                table: "ExerciseTemplates",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CommonMistakes",
                table: "ExerciseTemplates");

            migrationBuilder.DropColumn(
                name: "Difficulty",
                table: "ExerciseTemplates");

            migrationBuilder.DropColumn(
                name: "Equipment",
                table: "ExerciseTemplates");

            migrationBuilder.DropColumn(
                name: "ExecutionSteps",
                table: "ExerciseTemplates");

            migrationBuilder.DropColumn(
                name: "HowToImageUrl",
                table: "ExerciseTemplates");

            migrationBuilder.DropColumn(
                name: "Mechanics",
                table: "ExerciseTemplates");

            migrationBuilder.DropColumn(
                name: "MusclesImageUrl",
                table: "ExerciseTemplates");

            migrationBuilder.DropColumn(
                name: "PrimaryMuscles",
                table: "ExerciseTemplates");

            migrationBuilder.DropColumn(
                name: "SecondaryMuscles",
                table: "ExerciseTemplates");

            migrationBuilder.DropColumn(
                name: "ShortDescription",
                table: "ExerciseTemplates");

            migrationBuilder.DropColumn(
                name: "Tips",
                table: "ExerciseTemplates");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "ExerciseTemplates");

            migrationBuilder.DropColumn(
                name: "VideoUrl",
                table: "ExerciseTemplates");
        }
    }
}
