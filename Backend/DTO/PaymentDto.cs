using System.ComponentModel.DataAnnotations;

namespace Homecare.DTO
{
    public class PaymentCreateDto
    {
        [Required]
        public int InvoiceId { get; set; }

        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal Amount { get; set; }

        [Required]
        public string PaymentMethod { get; set; }

        public string Notes { get; set; }
    }

    public class PaymentSendDto
    {
        public int Id { get; set; }
        public int InvoiceId { get; set; }
        public decimal Amount { get; set; }
        public DateTime PaymentDate { get; set; }
        public string PaymentMethod { get; set; }
        public string Status { get; set; }
        public string StripePaymentIntentId { get; set; }
        public string StripeChargeId { get; set; }
        public string TransactionId { get; set; }
        public string Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class StripePaymentIntentDto
    {
        public string ClientSecret { get; set; }
        public string PaymentIntentId { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; }
    }
}