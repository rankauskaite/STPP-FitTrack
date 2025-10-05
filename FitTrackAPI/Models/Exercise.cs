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

        [JsonIgnore]
        public ICollection<Workout> Workouts { get; set; } = new List<Workout>();
    }
}