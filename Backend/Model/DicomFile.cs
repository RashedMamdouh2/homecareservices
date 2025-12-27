using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Homecare.Model
{
    public class DicomFile
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int PatientId { get; set; }
        public Patient Patient { get; set; }

        [Required]
        public int PhysicianId { get; set; }
        public Physician Physician { get; set; }

        [Required]
        public string FileName { get; set; }

        [Required]
        public string OriginalFileName { get; set; }

        [Required]
        public string FilePath { get; set; }

        [Required]
        public long FileSize { get; set; }

        [Required]
        public string ContentType { get; set; }

        [Required]
        public DateTime UploadDate { get; set; }

        public string? StudyInstanceUID { get; set; }
        public string? SeriesInstanceUID { get; set; }
        public string? SOPInstanceUID { get; set; }

        public string? Modality { get; set; }
        public string? BodyPart { get; set; }
        public string? StudyDescription { get; set; }

        [Required]
        public string AnalysisStatus { get; set; } = "pending"; // pending, processing, completed, failed

        // AI Analysis Results
        public string? AIAnalysisResult { get; set; }
        public decimal? ConfidenceScore { get; set; }
        public DateTime? AnalysisDate { get; set; }

        public string? Notes { get; set; }

        // Navigation property
        public List<DicomAnnotation> Annotations { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public DicomFile()
        {
            UploadDate = DateTime.UtcNow;
            Annotations = new List<DicomAnnotation>();
        }
    }
}