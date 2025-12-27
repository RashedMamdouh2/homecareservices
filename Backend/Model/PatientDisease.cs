using System.ComponentModel.DataAnnotations.Schema;

namespace Homecare.Model
{
    public class PatientDisease
    {
        public int ID { get; set; }
        [ForeignKey(nameof(Patient))]
        public int PatientId { get; set; }
        public Patient Patient { get; set; }
        [ForeignKey(nameof(Disease))]
        public string ICD { get; set; }
        public Disease Disease { get; set; }
        public DateOnly DiagnosisDate { get; set; }
        public DateOnly? RecoverdDate { get; set; }

    }
}
