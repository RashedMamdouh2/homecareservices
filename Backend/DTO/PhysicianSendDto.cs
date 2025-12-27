using Homecare.Model;

namespace Homecare.DTO
{
    public class PhysicianSendDto
    {
        public int Id { get; set; }
        public string Name { get; set; }

        public string SpecializationName { get; set; }
        public string ClinicalAddress { get; set; }
        public string Image { get; set; }
        public decimal SessionPrice { get; set; }

    }
}
