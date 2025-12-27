using Homecare.Model;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Homecare.DTO
{
    public class PatientSendDto
    {
        public int? Id { get; set; }
        public string Name { get; set; }
        [Phone]
        public string Phone { get; set; }
        public string Gender { get; set; }
        public string Address { get; set; }
        public string City { get; set; }
        
        public string Image { get; set; }
        public string SubscriptionName { get; set; }
        public decimal SubscriptionPrice { get; set; }

       
    }
}
