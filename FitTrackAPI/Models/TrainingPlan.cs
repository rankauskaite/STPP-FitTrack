using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace FitTrackAPI.Models
{
    public class TrainingPlan
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public int DurationWeeks { get; set; }
        public string Type { get; set; } = null!;
        public bool IsPublic { get; set; }
        public bool IsApproved { get; set; }

        // Naujas laukas
        public string? ImageUrl { get; set; } // ← galima null

        // Owner
        [ForeignKey(nameof(User))]
        public required string Username { get; set; }
        public User? User { get; set; }

        [JsonIgnore]
        public ICollection<Workout> Workouts { get; set; } = new List<Workout>();

        // Kolekcija vartotojų, kurie išsaugojo planą
        [JsonIgnore]
        public ICollection<User> SavedByUsers { get; set; } = new List<User>();
    }
}