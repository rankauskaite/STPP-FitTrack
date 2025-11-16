using System.ComponentModel.DataAnnotations.Schema;
using FitTrackAPI.Models;

public class Rating
{
    public int Id { get; set; }

    [ForeignKey(nameof(User))]
    public required string Username { get; set; }
    public User? User { get; set; }
    public int TrainingPlanId { get; set; }
    public int Score { get; set; } // 1–5
}
