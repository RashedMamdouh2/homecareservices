using System.ComponentModel.DataAnnotations;

namespace Homecare.Model
{
    public class AnalyticsData
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public DateTime Date { get; set; }

        [Required]
        public string MetricName { get; set; }

        [Required]
        public decimal Value { get; set; }

        public string? AdditionalData { get; set; } // JSON for additional context

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}