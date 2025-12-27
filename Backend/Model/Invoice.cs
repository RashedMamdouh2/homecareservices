using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Homecare.Model
{
    public class Invoice
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int PatientId { get; set; }
        public Patient Patient { get; set; }

        [Required]
        public decimal Amount { get; set; }

        [Required]
        public string Description { get; set; }

        [Required]
        public DateTime InvoiceDate { get; set; }

        public DateTime? DueDate { get; set; }

        [Required]
        public string Status { get; set; } = "unpaid"; // unpaid, paid, overdue, cancelled

        // Stripe payment intent ID
        public string? StripePaymentIntentId { get; set; }

        // Navigation property
        public List<Payment> Payments { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public Invoice()
        {
            InvoiceDate = DateTime.UtcNow;
            DueDate = DateTime.UtcNow.AddDays(30);
            Payments = new List<Payment>();
        }
    }
}