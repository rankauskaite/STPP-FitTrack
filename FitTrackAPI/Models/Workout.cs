using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace FitTrackAPI.Models
{
    public class Workout
    {
        public int Id { get; set; }
        public DateTime Date { get; set; }
        public string Type { get; set; } = null!;
        public int DurationMinutes { get; set; }
        public int CaloriesBurned { get; set; }

        [ForeignKey(nameof(User))]
        public required string Username { get; set; }
        public User? User { get; set; }

        [JsonIgnore]
        public ICollection<Exercise> Exercises { get; set; } = new List<Exercise>();

        [JsonIgnore]
        public ICollection<TrainingPlan> TrainingPlans { get; set; } = new List<TrainingPlan>();
    }
}