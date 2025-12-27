using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Homecare.Model
{
    public class DicomAnnotation
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int DicomFileId { get; set; }
        public DicomFile DicomFile { get; set; }

        [Required]
        public int PhysicianId { get; set; }
        public Physician Physician { get; set; }

        [Required]
        public string AnnotationType { get; set; } // e.g., "measurement", "finding", "region"

        [Required]
        public string AnnotationData { get; set; } // JSON data for coordinates, measurements, etc.

        public string? Description { get; set; }

        [Required]
        public DateTime CreatedDate { get; set; }

        public DateTime? ModifiedDate { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public DicomAnnotation()
        {
            CreatedDate = DateTime.UtcNow;
        }
    }
}