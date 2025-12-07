using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace FitTrackAPI.Models
{
    public class Exercise
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public int Sets { get; set; }
        public int Reps { get; set; }
        public double Weight { get; set; }
        public string? ImageUrl { get; set; }
        public int? ExerciseTemplateId { get; set; }
        public ExerciseTemplate? ExerciseTemplate { get; set; }

        [ForeignKey(nameof(User))]
        public required string Username { get; set; }
        public User? User { get; set; }

        [JsonIgnore]
        public ICollection<Workout> Workouts { get; set; } = new List<Workout>();
    }
}