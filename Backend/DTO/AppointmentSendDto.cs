using System.ComponentModel.DataAnnotations;

namespace Homecare.DTO
{
    public class AppointmentSendDto
    {
        public Guid Id { get; set; }
        public DateTime AppointmentDate { get; set; }

        [Required]
        public TimeOnly StartTime { get; set; }

        [Required]
        public TimeOnly EndTime { get; set; }
        public string PatientName { get; set; }
        public string PhysicianName { get; set; }
        public string PhysicianNotes { get; set; }
        public string MeetingAddress { get; set; }
        public List<MedicationSendAndCreateDto> ?Medications { get; set; }
        public string PdfBase64 { get; set; }
    }
}