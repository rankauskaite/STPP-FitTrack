namespace FitTrackAPI.Models
{
    public enum ExerciseCategory
    {
        Krutine,
        Nugara,
        Kojos,
        Peciai,
        Bicepsas,
        Tricepsas,
        Presas,
        Kardio,
        Kita
    }

    public enum ExerciseDifficulty
    {
        Beginner,      // Pradedantiesiems
        Intermediate,  // Vidutinis
        Advanced       // Pažengusiems
    }

    public enum ExerciseType
    {
        Strength,   // Jėga
        Cardio,     // Kardio
        Mobility,   // Mobilumas / lankstumas
        Stretching, // Tempimas
        Other
    }

    public enum MechanicsType
    {
        Compound,   // Keli sąnariai
        Isolation   // Vienas sąnarys
    }
}