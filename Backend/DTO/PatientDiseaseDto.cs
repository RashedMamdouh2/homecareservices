namespace Homecare.DTO
{
    public class PatientDiseaseDto
    {
        public int PatientId { get; set; }
        public string ICD { get; set; }
        public string? DiseaseName { get; set; }
        public DateOnly DiagnosisDate { get; set; }
        public DateOnly? RecoverdDate { get; set; }
    }
}
