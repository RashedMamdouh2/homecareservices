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
    
    public class PatientController : ControllerBase
    {
        private readonly IUnitOfWork unitOfWork;
        private readonly IImageServices imageServices;

        public PatientController(IUnitOfWork unitOfWork, IImageServices imageServices)
        {
            this.unitOfWork = unitOfWork;
            this.imageServices = imageServices;
            
        }
        [HttpGet("GetPatient/{id:int}")]
        public async Task<IActionResult> GetPatient(int id)
        {
            var patientDB = await unitOfWork.Patients.FindAsync(patient=>patient.Id==id,new string[] { nameof(Patient.Subscription)});
            if (patientDB == null) {
                return NotFound("Wrong ID");
            }
            var patient = new PatientSendDto {
                Id=patientDB.Id,
                Name = patientDB.Name,
                Phone = patientDB.Phone,
                Address = patientDB.Address,
                City = patientDB.City,
                Gender = patientDB.Gender,
                Image = patientDB.Image,
                SubscriptionName=patientDB.Subscription.Name.ToString(),
                SubscriptionPrice=patientDB.Subscription.Price,

            };
            return Ok(patient);
        }
        [HttpGet("GetAllPatients")]
        public IActionResult GetAllPatients()
        {

            var patients = unitOfWork.Patients.FindAll(p=>true, new string[] { nameof(Patient.Subscription) }).OrderByDescending(p => p.Subscription.Price).Select(p => new PatientSendDto {
                Id = p.Id, 
                Name = p.Name,
                Phone = p.Phone,
                Address = p.Address,
                City = p.City,
                Gender = p.Gender,
                Image = p.Image,
                SubscriptionName = p.Subscription.Name.ToString(),
                SubscriptionPrice = p.Subscription.Price,


            });
            return Ok(patients);
        }
        [HttpGet("GetPatientAppointments/{patientId:int}")]
        public  IActionResult GetAppointment(int patientId)
        {
            var AppointmentDB =  unitOfWork.Appointments.FindAll(app => app.PatientId == patientId, new string[] { nameof(Model.Appointment.Report),nameof(Patient),nameof(Physician) }).ToList();


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
        [HttpGet("medicine/{patientId:int}")]
        public async Task<IActionResult> GetPatientsMedicines(int patientId)
        {
            var patient = await unitOfWork.Patients.FindAsync(pat => pat.Id == patientId, new string[] { nameof(Patient.Medications) });
            if (patient is null) return NotFound("No Patient Found");
            if (patient.Medications.Count == 0) return NotFound("No Medications");
            return Ok(patient.Medications.Select(Med=>new MedicationDto
            {
                Description= Med.Description,
                Dose=Med.Dose,
                DoseFrequency=Med.DoseFrequency,
                Name=Med.Name,
                Id=Med.Id,
                UsageTimes=Med.UsageTimes,

            }));
        }
        [HttpGet("disease/{patientId:int}")]
        public IActionResult GetPatientDiseases(int patientId)
        {
            var diseases =  unitOfWork.PatientDiseases.FindAll(pat => pat.PatientId == patientId, new string[]  { nameof(PatientDisease.Disease) });
            if (diseases is null) return NotFound("No Patient Found");
           
            return Ok(diseases.Select(dis=>new PatientDiseaseDto
            {
                DiagnosisDate     =dis.DiagnosisDate,
                ICD               =dis.ICD,
                PatientId         =dis.PatientId,
                RecoverdDate      =dis.RecoverdDate,
                DiseaseName       =dis.Disease.Name

            }));
        }

        [HttpPost("AddPatient")]
        public async Task<IActionResult> AddPatient([FromForm] PatientCreateDto patientDto)
        {
            var allowedTypes = new[] { "image/jpeg", "image/png", "image/jpg" };
            if (patientDto.Image != null && (!allowedTypes.Contains(patientDto.Image.ContentType.ToLower()) || patientDto.Image.Length > 1000 * 1024))
            {
                return BadRequest("Image Should be png, jpg or jpeg of Maximum 1000 KB Size");
            }
            var p = new Patient
            {
                Name = patientDto.Name,
                Phone = patientDto.Phone,
                Address = patientDto.Address,
                City = patientDto.City,
                Gender = patientDto.Gender,
                Image = await imageServices.ReadImage(patientDto.Image)

            };
            await unitOfWork.Patients.AddAsync(p);
            await unitOfWork.SaveDbAsync();
            return CreatedAtAction(nameof(GetPatient), routeValues: new { id = p.Id }, p);
        }

        [HttpPost("disease/{patientId:int}")]

        public async Task<IActionResult> AddDiseaseToPatient(PatientDiseaseDto disease)
        {
            
            var patientDb = await unitOfWork.Patients.GetById(disease.PatientId);
            if (patientDb == null) return NotFound("Wrong Patient");
            var diseaseDb = await unitOfWork.Diseases.FindAsync(dis=>dis.ICD==disease.ICD,new string[] { });
            if (diseaseDb == null) return NotFound("Wrong ICD Code");

            await unitOfWork.PatientDiseases.AddAsync(new PatientDisease
            {
                PatientId = disease.PatientId,
                ICD = disease.ICD,
                DiagnosisDate = disease.DiagnosisDate,
                RecoverdDate = disease.RecoverdDate,
            });
            await unitOfWork.SaveDbAsync();
            return Created();   
        }
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdatePatient(PatientCreateDto updated,int id)
        {
            var old = await unitOfWork.Patients.GetById(id);
            if (old is null) return NotFound("Wrong ID");
            old.Name= updated.Name;
            old.Phone= updated.Phone;
            old.Address= updated.Address;
            old.City= updated.City;
            old.Gender= updated.Gender;
            if(updated.Image is not null)
                old.Image=await imageServices.ReadImage(updated.Image);

            if (updated.SubscriptionId is not null) old.SubscriptionId =(int)updated.SubscriptionId;
            unitOfWork.Patients.UpdateById(old);
            await unitOfWork.SaveDbAsync();
            return CreatedAtAction(nameof(GetPatient), routeValues: new { id = old.Id }, updated);

        }
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> RemovePatient([FromRoute]int id)
        {
            var patient = await unitOfWork.Patients.GetById(id);
            if (patient is null) return NotFound("Wrong ID");
            unitOfWork.Patients.Delete(patient);
            await unitOfWork.SaveDbAsync();
            return Ok();
        }



    }



}
