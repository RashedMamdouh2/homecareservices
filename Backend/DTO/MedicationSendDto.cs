using System.ComponentModel.DataAnnotations;

namespace Homecare.DTO
{
    public class MedicationSendAndCreateDto
    {
        [Required]
        public string Name { get; set; }
        public string? Description { get; set; }
        public int? DoseFrequency { get; set; }
        public decimal? Dose { get; set; }
        public List<TimeOnly>? UsageTimes { get; set; }
    }
}