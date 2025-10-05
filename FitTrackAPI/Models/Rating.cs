public class Rating
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int TrainingPlanId { get; set; }
    public int Score { get; set; } // 1–5
}
