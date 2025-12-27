using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace Homecare.Model
{
    [PrimaryKey(nameof(Disease.ICD))]
    public class Disease
    {
        [Required]
        public string  ICD { get; set; }
        [Required]
        public string Name { get; set; }
        public List<PatientDisease>patientDiseases { get; set; }
        public Disease()
        {
            patientDiseases=new List<PatientDisease>();
        }
    }
}
