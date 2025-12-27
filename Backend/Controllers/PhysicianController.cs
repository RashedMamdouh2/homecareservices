using Homecare.DTO;
using Homecare.Model;
using Homecare.Repository;
using Homecare.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Homecare.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PhysicianController : ControllerBase
    {
        private readonly IUnitOfWork unitOfWork;
        private readonly IImageServices imageServices;

        public PhysicianController(IUnitOfWork unitOfWork, IImageServices imageServices)
        {
            this.unitOfWork = unitOfWork;
            this.imageServices = imageServices;
        }
        [HttpGet("GetPhysician/{id:int}")]
        public async Task<IActionResult> GetPhysician(int id)
        {
            var PhysicianDB = await unitOfWork.Physicians.FindAsync(ph=>ph.Id==id,new string[] {nameof(Model.Physician.Specialization)});
            if (PhysicianDB == null)
            {
                return NotFound("Wrong ID");
            }
            var Physician = new PhysicianSendDto
            {
                Id = PhysicianDB.Id,
                Name = PhysicianDB.Name,
                ClinicalAddress = PhysicianDB.ClinicalAddress,
                SpecializationName=PhysicianDB.Specialization.Name,
                Image = PhysicianDB.Image,
                SessionPrice = PhysicianDB.SessionPrice,

            };
            return Ok(Physician);
        }
        [HttpGet("GetAllPhysicians")]
        public IActionResult GetAllPhysicians()
        {

            var Physicians = unitOfWork.Physicians.FindAll(p=>true,new string[] { nameof(Model.Physician.Specialization)}).OrderBy(p => p.Name).Select(p => new PhysicianSendDto
            {
                Id = p.Id,
                Name = p.Name,
                ClinicalAddress = p.ClinicalAddress,
                SpecializationName = p.Specialization.Name,
                Image = p.Image,


            });
            return Ok(Physicians);
        }
        [HttpGet("GetPhysicianAppointments/{physicianId:int}")]
        [Authorize(Roles ="admin,physician")]
        public  IActionResult GetAppointment(int physicianId)
        {
            var AppointmentDB = unitOfWork.Appointments.FindAll(app => app.PhysicianId == physicianId, new string[] { nameof(Model.Appointment.Report), nameof(Patient), nameof(Physician) }).ToList();


            if (AppointmentDB == null)
            {
                return NotFound("Wrong ID");
            }
            var Appointments = AppointmentDB.Select(app => new AppointmentSendDto
            {
                Id = app.Id,
                StartTime = app.StartTime,
                EndTime = app.EndTime,
                MeetingAddress = app.MeetingAddress,
                AppointmentDate = app.AppointmentDate,
                PatientName = app.Patient.Name,
                PhysicianName = app.Physician.Name,
                PhysicianNotes = app.PhysicianNotes,
                Medications = new(),
                PdfBase64 = app.Report is null?"":app.Report.Pdf
            });
            return Ok(Appointments);
        }
        [HttpGet("FreeAppointments/Day/{physicianId:int}")]
        public async Task<IActionResult> GetFreeTimes(int physicianId, [FromQuery] DateOnly date)
        {
           var physician= await unitOfWork.Physicians.FindAsync(phy => phy.Id == physicianId, new string[] { });
            if (physician == null) { return NotFound("No Physician Found"); }
            var availableHoursAtThisDay = physician.AvailableTimeTable.Where(datetime => date.Equals(new DateOnly(datetime.Year, datetime.Month, datetime.Day))).Select(datetime => new TimeOnly(datetime.Hour, datetime.Minute, datetime.Second));
            return Ok(availableHoursAtThisDay);
        }
        [HttpGet("feedbacks/{physicianId:int}")]
        public IActionResult GetPhysicanFeedbacks(int physicianId)
        {
            var feedback = unitOfWork.Feedbacks.FindAll(feed => feed.PhysicianId == physicianId, new string[] { nameof(Feedback.Patient) });
            return Ok(feedback.Select(feedbackDb=>new FeedbackDto
            {

                Description =feedbackDb.Description,
                PatientId   =feedbackDb.PatientId,
                PhysicianId =feedbackDb.PhysicianId,
                PatientName  =feedbackDb.Patient.Name,
                rate         =feedbackDb.rate

            }));
        }
        [HttpPost("AddPhysician")]
        [Authorize(Roles ="admin")]
        public async Task<IActionResult> AddPhysician([FromForm] PhysicianCreateDto PhysicianDto)
        {
            var allowedTypes = new[] { "image/jpeg", "image/png", "image/jpg" };
            if (PhysicianDto.Image != null && (!allowedTypes.Contains(PhysicianDto.Image.ContentType.ToLower()) || PhysicianDto.Image.Length > 1000 * 1024))
            {
                return BadRequest("Image Should be png, jpg or jpeg of Maximum 1000 KB Size");
            }
            var p = new Physician
            {
                Name = PhysicianDto.Name,
                SpecializationId= PhysicianDto.SpecializationId,
                ClinicalAddress= PhysicianDto.ClinicalAddress,
                Image = await imageServices.ReadImage(PhysicianDto.Image)

            };
            await unitOfWork.Physicians.AddAsync(p);
            await unitOfWork.SaveDbAsync();
            return CreatedAtAction(nameof(GetPhysician), routeValues: new { id = p.Id }, PhysicianDto);
        }
        [HttpPost("FreeAppointments/{physicianId:int}")]
        [Authorize(Roles="physician")]
        public async Task<IActionResult> AddPhysicianFreeAppointments(int physicianId,[FromBody] List<DateTime>freeTimes)
        {
            var physician= await unitOfWork.Physicians.FindAsync(ph => ph.Id == physicianId, new string[] {  });
                if (physician == null) { return NotFound("No Physician Found"); }
            physician.AvailableTimeTable.AddRange(freeTimes);
            physician.AvailableTimeTable=physician.AvailableTimeTable.Distinct().ToList();
            
            await unitOfWork.SaveDbAsync();
            return CreatedAtAction(actionName: nameof(GetAppointment), routeValues: new { physicianId = physicianId },value:new { Avaliable=freeTimes });

        }
        [HttpPost("feedbacks/{physicianId:int}")]
        public async Task<IActionResult> AddFeedbackToPhysician(int physicianId,FeedbackDto feedback)
        {
            var patient =await unitOfWork.Patients.GetById(feedback.PatientId);
            if (patient is null) return NotFound("Wrong Patient ID");
            var physician =await unitOfWork.Physicians.GetById(feedback.PhysicianId);
            if (physician is null) return NotFound("Wrong Physician ID");
            if (feedback.rate < 0 || feedback.rate > 5) return BadRequest("Wrong rate");
            var newFeedback = new Feedback
            {
                Description = feedback.Description,
                PatientId = feedback.PatientId,
                PhysicianId = physicianId,
                rate = feedback.rate,

            };
            await unitOfWork.Feedbacks.AddAsync(newFeedback);
            await unitOfWork.SaveDbAsync();
            return CreatedAtAction(nameof(GetPhysicanFeedbacks), routeValues: new { physicianId = physicianId }, value: new { feedback = feedback });





        }
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdatePhysician(PhysicianCreateDto updated, int id)
        {
            var old = await unitOfWork.Physicians.GetById(id);
            if (old is null) return NotFound("Wrong ID");
            old.Name = updated.Name;
            old.ClinicalAddress = updated.ClinicalAddress;
            old.SpecializationId= updated.SpecializationId;
            old.Image = await imageServices.ReadImage(updated.Image);
            old.SessionPrice= updated.SessionPrice;
            unitOfWork.Physicians.UpdateById(old);
            await unitOfWork.SaveDbAsync();
            return CreatedAtAction(nameof(GetPhysician), routeValues: new { id = old.Id }, updated);

        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles ="admin")]
        public async Task<IActionResult> RemovePhysician(int id)
        {
            var Physician = await unitOfWork.Physicians.GetById(id);
            if (Physician is null) return NotFound("Wrong ID");
            unitOfWork.Physicians.Delete(Physician);
            await unitOfWork.SaveDbAsync();
            return Ok();
        }
    }
}
