namespace Homecare.DTO
{
    public class PaymentDetailsDto
    {
        public string PatientUserId { get; set; }
        public string CancelUrl { get; set; }
        public string SuccessUrl { get; set; }
        public string? CustomerEmail { get; set; }
        public decimal SessionPrice { get; set; }
    }
}
