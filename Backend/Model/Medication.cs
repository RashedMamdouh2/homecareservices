using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Homecare.Model
{
    public class Medication
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; }

        public string ?Description { get; set; }

        public int? DoseFrequency { get; set; }
        public decimal? Dose { get; set; }
        public List<TimeOnly>? UsageTimes { get; set; }
        [ForeignKey(nameof(Patient))]
        public int ? PatientId { get; set; }
        public Patient Patient { get; set; }
    }

}
