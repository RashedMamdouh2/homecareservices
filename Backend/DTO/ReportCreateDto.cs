namespace Homecare.DTO
{
    public class ReportCreateDto
    {
        public string Descritpion { get; set; }
        public int patientId { get; set; }
        public int PhysicianId { get; set; }
        public List<MedicationSendAndCreateDto> Medications { get; set; }
    }
}