namespace Homecare.DTO
{
    public class FeedbackDto
    {
        public string Description { get; set; }
        public int rate { get; set; }
        public int PatientId { get; set; }
        public int PhysicianId { get; set; }
        public string? PatientName { get; set; }
    }
   
}
