using Homecare.DTO;
using Homecare.Model;
using Homecare.Repository;
using Homecare.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Homecare.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly IUnitOfWork unitOfWork;
        private readonly UserManager<ApplicationUser> userManager;
        private readonly RoleManager<IdentityRole> roleManager;
        private readonly IImageServices imageServices;
        private readonly SignInManager<ApplicationUser> signInManager;
        private readonly IConfiguration config;

        public AccountController(IUnitOfWork unitOfWork,UserManager<ApplicationUser> userManager,RoleManager<IdentityRole> roleManager,IImageServices imageServices,
            
            SignInManager<ApplicationUser> signInManager, IConfiguration config)
        {
            this.unitOfWork = unitOfWork;
            this.userManager = userManager;
            this.roleManager = roleManager;
            this.imageServices = imageServices;
            this.signInManager = signInManager;
            this.config = config;
        }
        [HttpPost("New/Role")]
        public async Task<IActionResult>AddRole([FromBody]string role)
        {


            var result =await roleManager.CreateAsync(new IdentityRole {
                Id=Guid.NewGuid().ToString(),
                Name=role
            
            
            });
            if (result.Succeeded) return Ok($"{role} Added Successfully");
            return BadRequest(result.Errors);
        }
        [HttpPost("Signup/Patient")]
        public async Task<IActionResult> PatientSignup([FromForm]PatientCreateDto newPatient)
        {
            var newUser = new ApplicationUser
            {
                Email=newPatient.Email,
                UserName=newPatient.UserName,
                PhoneNumber=newPatient.Phone,
                
                
            };
           
            var result = await userManager.CreateAsync(newUser,newPatient.Password);
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(newUser, "patient");
                var allowedTypes = new[] { "image/jpeg", "image/png", "image/jpg" };
                if (newPatient.Image != null && (!allowedTypes.Contains(newPatient.Image.ContentType.ToLower()) || newPatient.Image.Length > 1000 * 1024))
                {
                    return BadRequest("Image Should be png, jpg or jpeg of Maximum 1000 KB Size");
                }
                var p = new Patient
                {
                    Name = newPatient.Name,
                    Phone = newPatient.Phone,
                    Address = newPatient.Address,
                    City = newPatient.City,
                    Gender = newPatient.Gender,
                    Image = await imageServices.ReadImage(newPatient.Image!)

                };
                await unitOfWork.Patients.AddAsync(p);
                await unitOfWork.SaveDbAsync();
                newUser.PatientId = p.Id;
                await userManager.UpdateAsync(newUser);

                return Ok(p);

            }
            return BadRequest(result.Errors);
        }

        [HttpPost("Signup/Physician")]
        public async Task<IActionResult> PhysicianSignup([FromForm] PhysicianCreateDto PhysicianDto)
        {
            var newUser = new ApplicationUser
            {
                Email=PhysicianDto.Email,
                UserName=PhysicianDto.UserName,
                PhoneNumber=PhysicianDto.Phone,
                
                
            };
           
            var result = await userManager.CreateAsync(newUser,PhysicianDto.Password);
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(newUser, "physician");

                var allowedTypes = new[] { "image/jpeg", "image/png", "image/jpg" };
                if (PhysicianDto.Image != null && (!allowedTypes.Contains(PhysicianDto.Image.ContentType.ToLower()) || PhysicianDto.Image.Length > 1000 * 1024))
                {
                    return BadRequest("Image Should be png, jpg or jpeg of Maximum 1000 KB Size");
                }
                var p = new Physician
                {
                    Name = PhysicianDto.Name,
                    SpecializationId = PhysicianDto.SpecializationId,
                    ClinicalAddress = PhysicianDto.ClinicalAddress,
                    Image = await imageServices.ReadImage(PhysicianDto.Image!),
                    SessionPrice=PhysicianDto.SessionPrice

                };
                await unitOfWork.Physicians.AddAsync(p);
                await unitOfWork.SaveDbAsync();
                newUser.PhysicianId= p.Id;
                await userManager.UpdateAsync(newUser);



                return Ok(p);

            }
            return BadRequest(result.Errors);
        }

        [HttpPost("Login")]
        public async Task<IActionResult> Login([FromBody]LoginDto loginDto)
        {
            var DbUser = await userManager.FindByNameAsync(loginDto.Username);
            var IsCorrectPassword =await signInManager.CheckPasswordSignInAsync(DbUser, loginDto.Password, lockoutOnFailure:false);
            
            if (IsCorrectPassword.Succeeded)
            {
                var roles = await userManager.GetRolesAsync(DbUser);
                var claims = new List<Claim> {
                            new Claim(ClaimTypes.Name, DbUser.UserName),
                            new Claim(ClaimTypes.NameIdentifier, DbUser.Id),
                            new Claim(JwtRegisteredClaimNames.Exp,DateTime.UtcNow.AddMinutes(10).ToString()),
                            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),

                        };
                if (DbUser.PatientId is not null) claims.Add(new Claim("PatientId", DbUser.PatientId.ToString()));
                if (DbUser.PhysicianId is not null) claims.Add(new Claim("PhysicianId", DbUser.PhysicianId.ToString()));
                foreach (var role in roles)
                {
                    claims.Add(new Claim(ClaimTypes.Role, role));
                }
                var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["JWT:Key"]));
                var signingCred = new SigningCredentials(key: securityKey, algorithm: SecurityAlgorithms.HmacSha256);
                var securityToken = new JwtSecurityToken(
                     issuer: config["JWT:issuer"],
                     audience: config["JWT:audience"],
                     claims: claims,
                     expires: DateTime.UtcNow.AddMinutes(10),
                     signingCredentials: signingCred

                    );
                var token = new JwtSecurityTokenHandler().WriteToken(securityToken);
                return Ok(token);


            }
            return NotFound("Username or Password is invalid");
        }

    }
}
