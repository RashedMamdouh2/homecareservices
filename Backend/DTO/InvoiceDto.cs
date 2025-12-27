using System.ComponentModel.DataAnnotations;

namespace Homecare.DTO
{
    public class InvoiceCreateDto
    {
        [Required]
        public int PatientId { get; set; }

        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal Amount { get; set; }

        [Required]
        public string Description { get; set; }

        public DateTime? DueDate { get; set; }
    }

    public class InvoiceSendDto
    {
        public int Id { get; set; }
        public int PatientId { get; set; }
        public string PatientName { get; set; }
        public decimal Amount { get; set; }
        public string Description { get; set; }
        public DateTime InvoiceDate { get; set; }
        public DateTime? DueDate { get; set; }
        public string Status { get; set; }
        public string StripePaymentIntentId { get; set; }
        public List<PaymentSendDto> Payments { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}