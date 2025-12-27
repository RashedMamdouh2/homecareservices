using Homecare.DTO;
using Homecare.Model;
using Homecare.Options;
using Homecare.Repository;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Stripe;

namespace Homecare.Controllers
{
    [Route("api/payments")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly StripeOptions _stripeOptions;

        public PaymentController(IUnitOfWork unitOfWork, IOptions<StripeOptions> stripeOptions)
        {
            _unitOfWork = unitOfWork;
            _stripeOptions = stripeOptions.Value;
        }

        [HttpPost("create-payment-intent")]
        [Authorize]
        public async Task<IActionResult> CreatePaymentIntent([FromBody] PaymentCreateDto paymentDto)
        {
            try
            {
                // Get invoice
                var invoice = await _unitOfWork.Invoices.FindAsync(i => i.Id == paymentDto.InvoiceId, Array.Empty<string>());
                if (invoice == null)
                    return NotFound("Invoice not found");

                if (invoice.Status == "paid")
                    return BadRequest("Invoice is already paid");

                // Set Stripe API key
                StripeConfiguration.ApiKey = _stripeOptions.ApiKey;

                // Create Stripe PaymentIntent
                var options = new PaymentIntentCreateOptions
                {
                    Amount = (long)(paymentDto.Amount * 100), // Convert to cents
                    Currency = "usd",
                    PaymentMethodTypes = new List<string> { "card" },
                    Metadata = new Dictionary<string, string>
                    {
                        { "invoice_id", invoice.Id.ToString() },
                        { "patient_id", invoice.PatientId.ToString() }
                    }
                };

                var service = new PaymentIntentService();
                var paymentIntent = await service.CreateAsync(options);

                // Update invoice with payment intent ID
                invoice.StripePaymentIntentId = paymentIntent.Id;
                invoice.UpdatedAt = DateTime.UtcNow;
                _unitOfWork.Invoices.UpdateById(invoice);
                await _unitOfWork.SaveDbAsync();

                // Create payment record
                var payment = new Payment
                {
                    InvoiceId = paymentDto.InvoiceId,
                    Amount = paymentDto.Amount,
                    PaymentMethod = paymentDto.PaymentMethod,
                    Status = "pending",
                    StripePaymentIntentId = paymentIntent.Id,
                    Notes = paymentDto.Notes
                };

                await _unitOfWork.Payments.AddAsync(payment);
                await _unitOfWork.SaveDbAsync();

                var result = new StripePaymentIntentDto
                {
                    ClientSecret = paymentIntent.ClientSecret,
                    PaymentIntentId = paymentIntent.Id,
                    Amount = paymentDto.Amount,
                    Currency = "usd"
                };

                return Ok(result);
            }
            catch (StripeException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("confirm-payment/{paymentIntentId}")]
        [Authorize]
        public async Task<IActionResult> ConfirmPayment(string paymentIntentId)
        {
            try
            {
                // Set Stripe API key
                StripeConfiguration.ApiKey = _stripeOptions.ApiKey;

                var service = new PaymentIntentService();
                var paymentIntent = await service.GetAsync(paymentIntentId);

                // Find payment record
                var payment = await _unitOfWork.Payments.FindAsync(p => p.StripePaymentIntentId == paymentIntentId, Array.Empty<string>());
                if (payment == null)
                    return NotFound("Payment not found");

                if (paymentIntent.Status == "succeeded")
                {
                    payment.Status = "completed";
                    payment.StripeChargeId = paymentIntent.LatestChargeId;
                    payment.TransactionId = paymentIntent.Id;
                    payment.UpdatedAt = DateTime.UtcNow;

                    // Update invoice status
                    var invoice = await _unitOfWork.Invoices.FindAsync(i => i.Id == payment.InvoiceId, Array.Empty<string>());
                    if (invoice != null)
                    {
                        invoice.Status = "paid";
                        invoice.UpdatedAt = DateTime.UtcNow;
                        _unitOfWork.Invoices.UpdateById(invoice);
                    }

                    _unitOfWork.Payments.UpdateById(payment);
                    await _unitOfWork.SaveDbAsync();

                    return Ok(new { status = "succeeded", paymentId = payment.Id });
                }
                else if (paymentIntent.Status == "requires_payment_method")
                {
                    payment.Status = "failed";
                    payment.UpdatedAt = DateTime.UtcNow;
                    _unitOfWork.Payments.UpdateById(payment);
                    await _unitOfWork.SaveDbAsync();

                    return BadRequest(new { status = "failed", error = "Payment requires a valid payment method" });
                }

                return Ok(new { status = paymentIntent.Status });
            }
            catch (StripeException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("invoice/{invoiceId}")]
        [Authorize]
        public async Task<IActionResult> GetInvoice(int invoiceId)
        {
            var invoice = await _unitOfWork.Invoices.FindAsync(i => i.Id == invoiceId,
                new[] { "Patient", "Payments" });

            if (invoice == null)
                return NotFound("Invoice not found");

            var invoiceDto = new InvoiceSendDto
            {
                Id = invoice.Id,
                PatientId = invoice.PatientId,
                PatientName = invoice.Patient.Name,
                Amount = invoice.Amount,
                Description = invoice.Description,
                InvoiceDate = invoice.InvoiceDate,
                DueDate = invoice.DueDate,
                Status = invoice.Status,
                StripePaymentIntentId = invoice.StripePaymentIntentId,
                CreatedAt = invoice.CreatedAt,
                UpdatedAt = invoice.UpdatedAt,
                Payments = invoice.Payments.Select(p => new PaymentSendDto
                {
                    Id = p.Id,
                    InvoiceId = p.InvoiceId,
                    Amount = p.Amount,
                    PaymentDate = p.PaymentDate,
                    PaymentMethod = p.PaymentMethod,
                    Status = p.Status,
                    StripePaymentIntentId = p.StripePaymentIntentId,
                    StripeChargeId = p.StripeChargeId,
                    TransactionId = p.TransactionId,
                    Notes = p.Notes,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt
                }).ToList()
            };

            return Ok(invoiceDto);
        }

        [HttpGet("patient/{patientId}/invoices")]
        [Authorize]
        public async Task<IActionResult> GetPatientInvoices(int patientId)
        {
            var invoices = _unitOfWork.Invoices.FindAll(i => i.PatientId == patientId,
                new[] { "Patient", "Payments" })
                .OrderByDescending(i => i.InvoiceDate);

            var invoiceDtos = invoices.Select(invoice => new InvoiceSendDto
            {
                Id = invoice.Id,
                PatientId = invoice.PatientId,
                PatientName = invoice.Patient.Name,
                Amount = invoice.Amount,
                Description = invoice.Description,
                InvoiceDate = invoice.InvoiceDate,
                DueDate = invoice.DueDate,
                Status = invoice.Status,
                StripePaymentIntentId = invoice.StripePaymentIntentId,
                CreatedAt = invoice.CreatedAt,
                UpdatedAt = invoice.UpdatedAt,
                Payments = invoice.Payments.Select(p => new PaymentSendDto
                {
                    Id = p.Id,
                    Amount = p.Amount,
                    PaymentDate = p.PaymentDate,
                    PaymentMethod = p.PaymentMethod,
                    Status = p.Status,
                    TransactionId = p.TransactionId
                }).ToList()
            });

            return Ok(invoiceDtos);
        }

        [HttpPost("create-invoice")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> CreateInvoice([FromBody] InvoiceCreateDto invoiceDto)
        {
            var patient = await _unitOfWork.Patients.FindAsync(p => p.Id == invoiceDto.PatientId, Array.Empty<string>());
            if (patient == null)
                return NotFound("Patient not found");

            var invoice = new Homecare.Model.Invoice
            {
                PatientId = invoiceDto.PatientId,
                Amount = invoiceDto.Amount,
                Description = invoiceDto.Description,
                DueDate = invoiceDto.DueDate
            };

            await _unitOfWork.Invoices.AddAsync(invoice);
            await _unitOfWork.SaveDbAsync();

            return CreatedAtAction(nameof(GetInvoice), new { invoiceId = invoice.Id }, invoice);
        }

        // Frontend API compatibility endpoints
        [HttpGet("invoices")]
        [Authorize]
        public async Task<IActionResult> GetUserInvoices()
        {
            var userId = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var user = await _unitOfWork.ApplicationUsers.FindAsync(u => u.Id == userId, Array.Empty<string>());
            if (user == null) return Unauthorized();

            // Get patient or physician based on role
            IEnumerable<Homecare.Model.Invoice> invoices;
            if (User.IsInRole("Patient"))
            {
                var patient = user.Patient;
                if (patient == null) return NotFound("Patient not found");
                invoices = await _unitOfWork.Invoices.FindAll(
                    i => i.PatientId == patient.Id,
                    new[] { "Patient", "Payments" }).ToListAsync();
            }
            else if (User.IsInRole("Physician") || User.IsInRole("Admin"))
            {
                // Admin/Physician can see all invoices
                invoices = await _unitOfWork.Invoices.FindAll(
                    i => true,
                    new[] { "Patient", "Payments" }).ToListAsync();
            }
            else
            {
                return Forbid();
            }

            var result = invoices.Select(i => new InvoiceSendDto
            {
                Id = i.Id,
                PatientId = i.PatientId,
                PatientName = i.Patient?.Name ?? "Unknown",
                Amount = i.Amount,
                Description = i.Description,
                InvoiceDate = i.InvoiceDate,
                DueDate = i.DueDate,
                Status = i.Status,
                Payments = i.Payments.Select(p => new PaymentSendDto
                {
                    Id = p.Id,
                    Amount = p.Amount,
                    PaymentDate = p.PaymentDate,
                    PaymentMethod = p.PaymentMethod,
                    Status = p.Status
                }).ToList()
            });

            return Ok(result);
        }

        [HttpPost("create-intent")]
        [Authorize]
        public async Task<IActionResult> CreateIntent([FromBody] PaymentCreateDto paymentDto)
        {
            return await CreatePaymentIntent(paymentDto);
        }

        [HttpPost("confirm")]
        [Authorize]
        public async Task<IActionResult> ConfirmPayment([FromBody] PaymentConfirmationDto confirmation)
        {
            return await ConfirmPaymentIntent(confirmation.PaymentIntentId);
        }

        private async Task<IActionResult> ConfirmPaymentIntent(string paymentIntentId)
        {
            try
            {
                var paymentIntentService = new PaymentIntentService();
                var paymentIntent = await paymentIntentService.ConfirmAsync(paymentIntentId);

                // Update payment status in database if needed
                var payment = await _unitOfWork.Payments.FindAsync(p => p.StripePaymentIntentId == paymentIntentId, new string[] { });
                if (payment != null)
                {
                    payment.Status = paymentIntent.Status;
                    _unitOfWork.Payments.UpdateById(payment);
                    await _unitOfWork.SaveDbAsync();
                }

                return Ok(new { status = paymentIntent.Status, clientSecret = paymentIntent.ClientSecret });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("generate-bill")]
        [Authorize(Roles = "Admin,Physician")]
        public async Task<IActionResult> GenerateBill([FromBody] InvoiceCreateDto invoiceDto)
        {
            return await CreateInvoice(invoiceDto);
        }

        [HttpGet("history")]
        [Authorize]
        public async Task<IActionResult> GetPaymentHistory()
        {
            var userId = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var user = await _unitOfWork.ApplicationUsers.FindAsync(u => u.Id == userId, Array.Empty<string>());
            if (user == null) return Unauthorized();

            IEnumerable<Payment> payments;
            if (User.IsInRole("Patient"))
            {
                if (user.PatientId == null) return NotFound("Patient not found");
                payments = await _unitOfWork.Payments.FindAll(
                    p => p.Invoice.PatientId == user.PatientId,
                    new[] { nameof(Payment.Invoice), $"{nameof(Payment.Invoice)}.{nameof(Homecare.Model.Invoice.Patient)}" }).ToListAsync();
            }
            else if (User.IsInRole("Physician") || User.IsInRole("Admin"))
            {
                payments = await _unitOfWork.Payments.FindAll(
                    p => true,
                    new[] { nameof(Payment.Invoice), $"{nameof(Payment.Invoice)}.{nameof(Homecare.Model.Invoice.Patient)}" }).ToListAsync();
            }
            else
            {
                return Forbid();
            }

            var result = payments.Select(p => new
            {
                Id = p.Id,
                InvoiceId = p.InvoiceId,
                PatientName = p.Invoice?.Patient?.Name ?? "Unknown",
                Amount = p.Amount,
                PaymentDate = p.PaymentDate,
                PaymentMethod = p.PaymentMethod,
                Status = p.Status,
                Description = p.Invoice?.Description ?? "N/A"
            });

            return Ok(result);
        }
    }
}