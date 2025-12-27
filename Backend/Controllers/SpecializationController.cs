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
    public class SpecializationController : ControllerBase
    {
        private readonly IUnitOfWork unitOfWork;
        private readonly IImageServices imageServices;

        public SpecializationController(IUnitOfWork unitOfWork, IImageServices imageServices)
        {
            this.unitOfWork = unitOfWork;
            this.imageServices = imageServices;
        }
        [HttpGet("GetSpecialization/{id:int}")]
        public async Task<IActionResult> GetSpecialization(int id) {

            var specialization = await unitOfWork.Specializations.FindAsync(sp => sp.Id == id, new string[] {});
            if (specialization is null) { 
                return NotFound("Wrong ID");
            }
            var specializationDto = new SpecializationSendDto
            {
                Id=specialization.Id,
                Name = specialization.Name,
                Description = specialization.Description
            };
            return Ok(specializationDto);

        }
        [HttpGet("GetAllSpecializations")]
        public  IActionResult GetAllSpecializations() {

            var specializations =  unitOfWork.Specializations.FindAll(sp => true, new string[] {}).Select(sp=>new SpecializationSendDto { Id=sp.Id,Description=sp.Description,Name=sp.Name});
           
            
            return Ok(specializations);

        }
        
        [HttpGet("GetPhysicians/{id:int}")]
        public async Task<IActionResult> GetAllPhysicinas(int id) {

            var specialization = await unitOfWork.Specializations.FindAsync(sp => sp.Id == id, new string[] { nameof(Specialization.Physicians)});
            if (specialization is null) { 
                return NotFound("Wrong ID");
            }
            return Ok(specialization!.Physicians.Select(p=>new PhysicianSendDto
            {
                Id=p.Id,
                SpecializationName = specialization.Name,
                ClinicalAddress=p.ClinicalAddress,
                Image=p.Image,
                Name=p.Name,
                SessionPrice=p.SessionPrice,
            }));

        }
        [HttpPost("AddSpecialization")]
        [Authorize(Roles = "admin")]

        public async Task<IActionResult> AddSpecialization(SpecializationSendDto specializationDto) {

            var specDb=new Specialization { Name=specializationDto.Name,Description=specializationDto.Description};
            await unitOfWork.Specializations.AddAsync(specDb);
            await unitOfWork.SaveDbAsync();
            return CreatedAtAction(nameof(GetSpecialization),routeValues: new { id=specDb.Id },specializationDto);
        }
        [HttpPut("{id:int}")]
        [Authorize(Roles ="admin")]
        public async Task<IActionResult> UpdateSpecialization(SpecializationSendDto updated, int id)
        {
            var old = await unitOfWork.Specializations.GetById(id);
            if (old is null) return NotFound("Wrong ID");
            old.Name = updated.Name;
            old.Description = updated.Description;
            unitOfWork.Specializations.UpdateById(old);
            await unitOfWork.SaveDbAsync();
            return CreatedAtAction(nameof(GetSpecialization), routeValues: new { id = old.Id }, updated);

        }
        [HttpDelete("{id:int}")]
        [Authorize(Roles ="admin")]
        
        public async Task<IActionResult> RemoveSpecialization(int id) {

            var specialization = await unitOfWork.Specializations.GetById(id);
            if (specialization is null) return NotFound("Wrong ID");
            unitOfWork.Specializations.Delete(specialization);
            await unitOfWork.SaveDbAsync();
            return Ok();
        }

    }
}
