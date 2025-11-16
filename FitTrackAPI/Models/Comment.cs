using System.ComponentModel.DataAnnotations.Schema;
using FitTrackAPI.Models;

public class Comment
{
    public int Id { get; set; }
    public string Text { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(User))]
    public required string Username { get; set; }
    public User? User { get; set; }

    public int? TrainingPlanId { get; set; }
    public TrainingPlan? TrainingPlan { get; set; }

    public int? WorkoutId { get; set; }
    public Workout? Workout { get; set; }

    public int? ExerciseId { get; set; }
    public Exercise? Exercise { get; set; }
}