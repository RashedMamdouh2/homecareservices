using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace Homecare.Model
{
    public class Physician {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; }

        public int SpecializationId { get; set; }
        public Specialization Specialization { get; set; }
        [Required]
        public string ClinicalAddress {  get; set; }
        [Required]
        public string Image { get; set; }
        public List<Appointment> ConfirmedAppointements {  get; set; }
        public List<Feedback> Feedbacks { get; set; }
        public List<DateTime> AvailableTimeTable { get; set; }

        public decimal SessionPrice { get; set; }
        public Physician()
        {
            ConfirmedAppointements = new List<Appointment>();
            AvailableTimeTable = new List<DateTime>();
            Feedbacks = new();
        }
    }
}
