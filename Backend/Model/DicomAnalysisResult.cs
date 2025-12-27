namespace Homecare.Model
{
    public class DicomAnalysisResult
    {
        public int Id { get; set; }
        public string AnalysisType { get; set; } = string.Empty;
        public string Result { get; set; } = string.Empty;
        public DateTime AnalysisDate { get; set; }
        public int DicomFileId { get; set; }
        public DicomFile DicomFile { get; set; } = null!;
        public string FileName { get; set; } = string.Empty;
        public string Findings { get; set; } = string.Empty;
        public double Confidence { get; set; }
        public string Recommendations { get; set; } = string.Empty;
        public DateTime AnalyzedAt { get; set; }
        public int PhysicianId { get; set; }
        public int PatientId { get; set; }
    }
}