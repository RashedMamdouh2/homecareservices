using System.ComponentModel.DataAnnotations;

namespace Homecare.DTO
{
    public class AnalyticsDashboardDto
    {
        public int TotalPatients { get; set; }
        public int TotalPhysicians { get; set; }
        public int TotalAppointments { get; set; }
        public int CompletedAppointments { get; set; }
        public int PendingAppointments { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal MonthlyRevenue { get; set; }
        public int TotalReports { get; set; }
        public int TotalMedications { get; set; }
        public int TotalDicomFiles { get; set; }
        public List<MonthlyDataPoint> RevenueChart { get; set; }
        public List<MonthlyDataPoint> AppointmentsChart { get; set; }
        public List<SpecializationStatsDto> SpecializationStats { get; set; }
    }

    public class MonthlyDataPoint
    {
        public string Month { get; set; }
        public decimal Value { get; set; }
        public int Count { get; set; }
    }

    public class SpecializationStatsDto
    {
        public string SpecializationName { get; set; }
        public int PhysicianCount { get; set; }
        public int AppointmentCount { get; set; }
    }

    public class AnalyticsQueryDto
    {
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string MetricType { get; set; }
        public string GroupBy { get; set; } // "day", "week", "month", "year"
    }
}