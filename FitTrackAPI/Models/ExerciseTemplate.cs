using System.Text.Json.Serialization;

namespace FitTrackAPI.Models
{
    public class ExerciseTemplate
    {
        public int Id { get; set; }

        public string Name { get; set; } = null!;

        // Pagrindinis GIF / nuotrauka (kaip dabar)
        public string ImageUrl { get; set; } = null!;

        // Papildomos nuotraukos
        // 1) Paryškintos raumenų grupės
        public string? MusclesImageUrl { get; set; }

        // 2) Kaip atlikti (pozicijos / step-by-step)
        public string? HowToImageUrl { get; set; }

        // YouTube ar kito šaltinio video nuoroda
        public string? VideoUrl { get; set; }

        // Kategorija (kaip turėjai)
        public ExerciseCategory Category { get; set; }

        // Nauji “training.fit” tipo laukai
        public ExerciseDifficulty Difficulty { get; set; }
        public ExerciseType Type { get; set; }
        public MechanicsType Mechanics { get; set; }

        public string? Equipment { get; set; }        // Įranga
        public string? PrimaryMuscles { get; set; }   // Pagrindiniai raumenys
        public string? SecondaryMuscles { get; set; } // Pagalbiniai raumenys

        // Trumpas aprašymas (kortelėms, listams)
        public string? ShortDescription { get; set; }

        // Detalesnis aprašymas – gali naudoti kaip Markdown tekstą
        public string? ExecutionSteps { get; set; }   // “How to”
        public string? Tips { get; set; }             // Patarimai
        public string? CommonMistakes { get; set; }   // Dažnos klaidos

        [JsonIgnore]
        public ICollection<Exercise> Exercises { get; set; } = new List<Exercise>();
    }
}