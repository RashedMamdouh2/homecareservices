using Homecare.Model;
using System.ComponentModel.DataAnnotations;

namespace Homecare.DTO
{
    public class PhysicianCreateDto
    {
        [Required]
        public string Name { get; set; }

        [Required]
        public int SpecializationId { get; set; }
        [Required]
        public string ClinicalAddress { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string Phone { get; set; }
        public string UserName { get; set; }
        [Required]
        public IFormFile Image { get; set; }
        public decimal SessionPrice { get; set; }

    }
}
