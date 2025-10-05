using System.Text.Json.Serialization;

namespace FitTrackAPI.Models
{
    public enum Role { Guest, Member, Trainer, Admin }

    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string Password { get; set; } = string.Empty; // paprastai, be hash
        public Role Role { get; set; }

        [JsonIgnore]
        public ICollection<TrainingPlan> TrainingPlans { get; set; } = new List<TrainingPlan>();
        [JsonIgnore]
        public ICollection<TrainingPlan> SavedPlans { get; set; } = new List<TrainingPlan>();
        public List<User> Clients { get; set; } = new(); // jei treneris
    }
}
