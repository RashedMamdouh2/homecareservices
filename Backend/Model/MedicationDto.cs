namespace Homecare.Model
{
    public class MedicationDto
    {
        public int Id { get; set; }
        
        public string Name { get; set; }

        public string? Description { get; set; }

        public int? DoseFrequency { get; set; }
        public decimal? Dose { get; set; }
        public List<TimeOnly>? UsageTimes { get; set; }
       
    }

}
