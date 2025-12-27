using Hangfire;
using Homecare.Model;
using Homecare.Repository;
using Microsoft.Identity.Client;

namespace Homecare.Services
{
    public class HangFireService : IHangFireService
        
    {
        private readonly IUnitOfWork unitOfWork;
        private readonly IMessagingService messagingService;
        private readonly ILogger<HangFireService> logger;

        public HangFireService(IUnitOfWork unitOfWork,IMessagingService messagingService,ILogger<HangFireService>_logger)
        {
            this.unitOfWork = unitOfWork;
            this.messagingService = messagingService;
            logger = _logger;
        }
        public void CheckMedicaitions()
        {
            var now = TimeOnly.FromDateTime(DateTime.Now);
             
            var medications = unitOfWork.Medications.FindAll(md => true, new string[] { nameof(Medication.Patient) }).ToList();
            logger.LogInformation($"At {now} Found: ");
            foreach (var medication in medications)
            {
                if (medication.UsageTimes.Any(t => Math.Abs((t.ToTimeSpan() - now.ToTimeSpan()).TotalMinutes) < 1))
                {

                var patientPhone = medication.Patient.Phone;
                string message = $"Hello {medication.Patient.Name}! Don't forget to take {medication.Name} Now with Dose {medication.Dose}";
                logger.LogInformation($"{medication.Name}\n");


                    messagingService.SendWhatsApp(patientPhone, message);
                }    
            }
            logger.LogInformation($"----------------------");

            //unitOfWork.Patients.FindAll(p => p.Medications.Contains(medications), new string[] { nameof(Patient.Medications)});
        }
    }
}
