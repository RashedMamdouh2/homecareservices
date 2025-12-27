using Homecare.DTO;

namespace Homecare.Services
{
    public interface IPDFService
    {
        public Task<string> CreateReportPDF(ReportCreateDto report);
    }
}