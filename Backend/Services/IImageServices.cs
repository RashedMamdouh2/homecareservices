namespace Homecare.Services
{
    public interface IImageServices
    {
        public  Task<byte[]> ConvertToArray(IFormFile Image);
        public string ConvertArrayToImage(byte[] img);
        public  Task<string> ReadImage(IFormFile Image);
    }
}
