using System.ComponentModel.DataAnnotations;

namespace Homecare.Model
{
    public class Subscription
    {
        public int Id { get; set; }
        [Required]
        public SubscriptionNames Name { get; set; }
        [Required]
        public decimal Price { get; set; }
        public Subscription()
        {
            
        }
    }
    public enum SubscriptionNames
    {
        EssentialSupport,
        AdvancedHomecare,
        TotalCare24_7
    }
}
