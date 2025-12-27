using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Homecare.Model
{
    public class Payment
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int InvoiceId { get; set; }
        public Invoice Invoice { get; set; }

        [Required]
        public decimal Amount { get; set; }

        [Required]
        public DateTime PaymentDate { get; set; }

        [Required]
        public string PaymentMethod { get; set; } = "stripe"; // stripe, paypal, bank_transfer

        [Required]
        public string Status { get; set; } = "pending"; // pending, completed, failed, refunded, cancelled

        // Stripe payment intent ID
        public string? StripePaymentIntentId { get; set; }

        // Stripe charge ID
        public string? StripeChargeId { get; set; }

        public string? TransactionId { get; set; }

        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public Payment()
        {
            PaymentDate = DateTime.UtcNow;
        }
    }
}