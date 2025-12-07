using FitTrackAPI.Models;

namespace FitTrackAPI.Services
{
    public static class WorkoutImageService
    {
        public static string GetImageForType(WorkoutType type)
        {
            return type switch
            {
                WorkoutType.Jegos     => "/workout/strength.jpg",
                WorkoutType.Kardio    => "/workout/cardio.jpg",
                WorkoutType.Istvermes => "/workout/endurance.jpg",
                WorkoutType.Tempimo   => "/workout/yoga.jpg",
                WorkoutType.Funkcine  => "/workout/functional.jpg",
                WorkoutType.Namu      => "/workout/home.jpg",
                _                     => "/workout/defaultWorkout.jpg"
            };
        }
    }
}