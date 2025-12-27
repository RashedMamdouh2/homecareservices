using Homecare.Model;
using Microsoft.AspNetCore.Mvc.ModelBinding.Binders;
using Microsoft.EntityFrameworkCore.SqlServer.Query.Internal;
using Microsoft.Win32.SafeHandles;
using System;

namespace Homecare.Services
{
    public class ImageServices:IImageServices
    {
        private readonly IWebHostEnvironment _env;

        public ImageServices(IWebHostEnvironment environment)
        {
            this._env = environment;
        }
        public async Task<byte[]> ConvertToArray(IFormFile Image)
        {
            byte[] result ;
            using (var stream = new MemoryStream())
            {
                await Image.CopyToAsync(stream);
                result = stream.ToArray();
                
            }
            return result;
        }
       public string ConvertArrayToImage(byte[] img)
        {
            string base64Image = Convert.ToBase64String(img);
            return base64Image;
        }
        public async Task<string> ReadImage(IFormFile Image)
        {
            string shortPath = Path.Combine("Images", Image.FileName);
            string fullPath = Path.Combine(_env.WebRootPath, shortPath);
            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await Image.CopyToAsync(stream);


            }
            return '/'+shortPath.Replace("\\", "/"); ;
        }
    }
    
}
