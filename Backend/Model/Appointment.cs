using Homecare.DTO;
using System.ComponentModel.DataAnnotations;

namespace Homecare.Model
{
    public class Appointment
    {
        public Guid Id { get; set; }
        [Required]
        public DateTime AppointmentDate { get; set; }
        [Required]
        public TimeOnly StartTime {  get; set; }
        [Required]
        public TimeOnly EndTime {  get; set; }
        [Required]
        public Patient Patient { get; set; }
        public int PatientId { get; set; }
        [Required]
        public Physician Physician { get; set; }
        public int PhysicianId { get; set; }
        
        public int? ReportId { get; set; }
        public Report? Report { get; set; }
        [Required]
        public string MeetingAddress { get; set; }
        [Required]
        public string PhysicianNotes { get; set; }
        public AppointmentStatus Status { get; set; }
        public Appointment()
        {
            Id = Guid.NewGuid();
            Status = AppointmentStatus.Pending;
        }
    }
    public enum AppointmentStatus
    {
       Confirmed,
       Pending,
       Canceled,
       Completed,
       FreeTime
       
    }


}
