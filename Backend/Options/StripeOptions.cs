using Microsoft.EntityFrameworkCore.Storage.ValueConversion.Internal;

namespace Homecare.Options
{
    public class StripeOptions
    {
        public string? ApiKey { get; set; }
        public string? PublishableKey { get; set; }
    }
}
