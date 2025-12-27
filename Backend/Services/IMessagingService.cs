namespace Homecare.Services
{
    public interface IMessagingService
    {
        public void SendWhatsApp(string to, string message);
    }
}
