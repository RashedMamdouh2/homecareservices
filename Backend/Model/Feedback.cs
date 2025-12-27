namespace Homecare.Model
{
    public class Feedback
    {
        public int Id { get; set; }
        public string Description { get; set; }
        public int rate { get; set; }
        public int PatientId { get; set; }
        public Patient Patient { get; set; }
        public int PhysicianId { get; set; }
        public Physician Physician { get; set; }
    }
}
