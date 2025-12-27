using Microsoft.AspNetCore.Identity;
using Twilio.Rest.Api.V2010.Account.Usage.Record;

namespace Homecare.Model
{
    public class ApplicationUser:IdentityUser
    {
        public int ?PatientId { get; set; }
        public Patient Patient { get; set; }
        public int ?PhysicianId { get; set; }
        public Physician Physician { get; set; }

        public ApplicationUser()
        {
            Id=Guid.NewGuid().ToString();
        }
    }
}
