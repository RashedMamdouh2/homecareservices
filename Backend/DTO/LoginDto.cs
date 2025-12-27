using Microsoft.AspNetCore.Mvc;

namespace Homecare.DTO
{
    public class LoginDto
    {
        public string Username { get; set; }
        public string Password { get; set; }
        public bool RememberMe { get; set; }
    }
}
