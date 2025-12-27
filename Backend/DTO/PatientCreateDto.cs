using Homecare.Model;
using System.ComponentModel.DataAnnotations;

namespace Homecare.DTO
{
    public class PatientCreateDto
    {
        public string Name { get; set; }
        [Phone]
        public string Phone { get; set; }
        public string Gender { get; set; }
        public string Address { get; set; }
        public string City { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string UserName { get; set; }

        public int? SubscriptionId { get; set; }
        public IFormFile Image { get; set; }
       
    }
}
