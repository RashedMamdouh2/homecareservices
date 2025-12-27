using Homecare.Model;
using Homecare.Repository;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Text;

namespace Homecare.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
   
    public class DiseasesController : ControllerBase
    {
        private readonly IUnitOfWork unitOfWork;

        public DiseasesController(IUnitOfWork unitOfWork)
        {
            this.unitOfWork = unitOfWork;
        }
        [HttpGet("search")]
        public  IActionResult FindDiseasesByName([FromQuery]string name)
        {
            var diseases=unitOfWork.Diseases.FindAll(dis => dis.Name.ToLower().Contains(name.ToLower()), new string[] { },take:10);
            return Ok(diseases);
            
        }

        [HttpPost("AddFile")]
        public async Task<IActionResult> AddICDCodes(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("File is empty");

            if (!file.FileName.EndsWith(".txt"))
                return BadRequest("Only .txt files are allowed");

            {

                using var stream = file.OpenReadStream();
                using var reader = new StreamReader(stream, Encoding.UTF8);

                var batch = new List<Disease>();
                int batchSize = 1000;

                while (!reader.EndOfStream)
                {
                    var line = await reader.ReadLineAsync();
                    if (string.IsNullOrWhiteSpace(line))
                        continue;

                    var firstSpaceIndex = line.IndexOf(' ');
                    if (firstSpaceIndex <= 0)
                        continue;

                    var code = line.Substring(0, firstSpaceIndex).Trim();
                    var name = line.Substring(firstSpaceIndex + 1).Trim();

                    batch.Add(new Disease
                    {
                        ICD = code,
                        Name = name
                    });

                    if (batch.Count >= batchSize)
                    {
                        await unitOfWork.Diseases.AddRangeAsync(batch);
                        await unitOfWork.SaveDbAsync();
                        batch.Clear();
                    }
                }

                // save remaining
                if (batch.Any())
                {
                    await unitOfWork.Diseases.AddRangeAsync(batch);
                    await unitOfWork.SaveDbAsync();
                }

            }

            return Ok("ICD-10 file imported successfully");

        }
    }
}
