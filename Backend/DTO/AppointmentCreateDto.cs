using System.ComponentModel.DataAnnotations;

namespace Homecare.DTO
{
    public class AppointmentCreateDto
    {
        public DateTime AppointmentDate { get; set; }

        [Required]
        public TimeOnly StartTime { get; set; }

        [Required]
        public TimeOnly EndTime { get; set; }
        public int patientId { get; set; }
        public int PhysicianId { get; set; }
        public string MeetingAddress { get; set; }
        [Required]
        public string PhysicianNotes { get; set; }
    }
}