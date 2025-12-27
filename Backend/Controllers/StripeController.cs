using Homecare.DTO;
using Homecare.Options;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Stripe;
using Stripe.Checkout;

namespace Homecare.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StripeController : ControllerBase
    {
        private readonly StripeOptions stripeOptions;

        public StripeController(IOptionsSnapshot<StripeOptions> _stripeOptions)
        {
            stripeOptions = _stripeOptions.Value;
        }
        [HttpPost]
        public async Task<IActionResult> PaySession(PaymentDetailsDto paymentDetails)
        {

            
            var origin = $"{Request.Scheme}://{Request.Host}";
            StripeConfiguration.ApiKey=stripeOptions.ApiKey;
            var stripeSession = new SessionService();
            var stripeCheckoutSession = await stripeSession.CreateAsync(
                new SessionCreateOptions
                {
                    Mode = "payment",
                    ClientReferenceId = paymentDetails.PatientUserId,
                    CustomerEmail = "random@gmail.com",
                    SuccessUrl = paymentDetails.SuccessUrl,
                    CancelUrl = paymentDetails.CancelUrl,
                    LineItems = new() {

                        new(){

                            PriceData = new()
                            {
                               Currency="USD",
                                ProductData = new()
                                {
                                    Name="Session Booking",
                                },
                                UnitAmountDecimal=paymentDetails.SessionPrice *100

                            }
                            ,Quantity=1
                        }
                    }
                }
                );
            return Ok(new {redirectUrl=stripeCheckoutSession.Url});
        }
    }
}
