using System.ComponentModel.DataAnnotations;

namespace Homecare.DTO
{
    public class DicomFileCreateDto
    {
        [Required]
        public int PatientId { get; set; }

        [Required]
        public int PhysicianId { get; set; }

        [Required]
        public IFormFile File { get; set; }

        public string Notes { get; set; }
    }

    public class DicomFileSendDto
    {
        public int Id { get; set; }
        public int PatientId { get; set; }
        public string PatientName { get; set; }
        public int PhysicianId { get; set; }
        public string PhysicianName { get; set; }
        public string FileName { get; set; }
        public string OriginalFileName { get; set; }
        public long FileSize { get; set; }
        public DateTime UploadDate { get; set; }
        public string StudyInstanceUID { get; set; }
        public string Modality { get; set; }
        public string BodyPart { get; set; }
        public string StudyDescription { get; set; }
        public string AnalysisStatus { get; set; }
        public string AIAnalysisResult { get; set; }
        public decimal? ConfidenceScore { get; set; }
        public DateTime? AnalysisDate { get; set; }
        public string Notes { get; set; }
        public List<DicomAnnotationSendDto> Annotations { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class DicomAnnotationCreateDto
    {
        [Required]
        public int DicomFileId { get; set; }

        [Required]
        public string AnnotationType { get; set; }

        [Required]
        public string AnnotationData { get; set; }

        public string Description { get; set; }
    }

    public class DicomAnnotationSendDto
    {
        public int Id { get; set; }
        public int DicomFileId { get; set; }
        public int PhysicianId { get; set; }
        public string PhysicianName { get; set; }
        public string AnnotationType { get; set; }
        public string AnnotationData { get; set; }
        public string Description { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}