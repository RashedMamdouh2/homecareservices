using Homecare.DTO;
using Homecare.Model;
using Homecare.Repository;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Homecare.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AnalyticsController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public AnalyticsController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [HttpGet("dashboard")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetDashboardAnalytics()
        {
            try
            {
                // Get current date for filtering
                var now = DateTime.UtcNow;
                var startOfMonth = new DateTime(now.Year, now.Month, 1);
                var startOfYear = new DateTime(now.Year, 1, 1);

                // Basic counts
                var totalPatients = await _unitOfWork.Patients.CountAsync();
                var totalPhysicians = await _unitOfWork.Physicians.CountAsync();
                var totalAppointments = await _unitOfWork.Appointments.CountAsync();
                var completedAppointments = await _unitOfWork.Appointments.CountAsync(a => a.Status == AppointmentStatus.Completed);
                var pendingAppointments = await _unitOfWork.Appointments.CountAsync(a => a.Status == AppointmentStatus.Confirmed);
                var totalReports = await _unitOfWork.Reports.CountAsync();
                var totalMedications = await _unitOfWork.Medications.CountAsync();
                var totalDicomFiles = await _unitOfWork.DicomFiles.CountAsync();

                // Revenue calculations
                var allPayments = await _unitOfWork.Payments.FindAll(p => p.Status == "completed", Array.Empty<string>()).ToListAsync();
                var totalRevenue = allPayments.Sum(p => p.Amount);
                var monthlyRevenue = allPayments.Where(p => p.PaymentDate >= startOfMonth).Sum(p => p.Amount);

                // Revenue chart (last 12 months)
                var revenueChart = new List<MonthlyDataPoint>();
                for (int i = 11; i >= 0; i--)
                {
                    var monthStart = new DateTime(now.Year, now.Month, 1).AddMonths(-i);
                    var monthEnd = monthStart.AddMonths(1);
                    var monthRevenue = allPayments
                        .Where(p => p.PaymentDate >= monthStart && p.PaymentDate < monthEnd)
                        .Sum(p => p.Amount);

                    revenueChart.Add(new MonthlyDataPoint
                    {
                        Month = monthStart.ToString("MMM yyyy"),
                        Value = monthRevenue
                    });
                }

                // Appointments chart (last 12 months)
                var appointmentsChart = new List<MonthlyDataPoint>();
                for (int i = 11; i >= 0; i--)
                {
                    var monthStart = new DateTime(now.Year, now.Month, 1).AddMonths(-i);
                    var monthEnd = monthStart.AddMonths(1);
                    var monthAppointments = await _unitOfWork.Appointments.CountAsync(
                        a => a.AppointmentDate >= monthStart && a.AppointmentDate < monthEnd);

                    appointmentsChart.Add(new MonthlyDataPoint
                    {
                        Month = monthStart.ToString("MMM yyyy"),
                        Count = monthAppointments
                    });
                }

                // Specialization stats
                var specializationStats = await _unitOfWork.Physicians.FindAll(p => true, new[] { nameof(Physician.Specialization) })
                    .GroupBy(p => p.Specialization)
                    .Select(g => new SpecializationStatsDto
                    {
                        SpecializationName = g.Key.Name,
                        PhysicianCount = g.Count(),
                        AppointmentCount = g.Sum(p => p.ConfirmedAppointements.Count)
                    })
                    .ToListAsync();

                var dashboard = new AnalyticsDashboardDto
                {
                    TotalPatients = totalPatients,
                    TotalPhysicians = totalPhysicians,
                    TotalAppointments = totalAppointments,
                    CompletedAppointments = completedAppointments,
                    PendingAppointments = pendingAppointments,
                    TotalRevenue = totalRevenue,
                    MonthlyRevenue = monthlyRevenue,
                    TotalReports = totalReports,
                    TotalMedications = totalMedications,
                    TotalDicomFiles = totalDicomFiles,
                    RevenueChart = revenueChart,
                    AppointmentsChart = appointmentsChart,
                    SpecializationStats = specializationStats
                };

                return Ok(dashboard);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("patients/overview")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetPatientsOverview()
        {
            var patients = await _unitOfWork.Patients.FindAll(p => true,
                new[] { nameof(Patient.Subscription), nameof(Patient.Appointements) }).ToListAsync();

            var overview = new
            {
                TotalPatients = patients.Count,
                BySubscription = patients.GroupBy(p => p.Subscription.Name)
                    .Select(g => new { Subscription = g.Key.ToString(), Count = g.Count() }),
                ByGender = patients.GroupBy(p => p.Gender)
                    .Select(g => new { Gender = g.Key, Count = g.Count() }),
                AverageAppointmentsPerPatient = patients.Any() ? patients.Average(p => p.Appointements.Count) : 0,
                NewPatientsThisMonth = 0 // TODO: Add CreatedAt to Patient model
            };

            return Ok(overview);
        }

        [HttpGet("appointments/overview")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetAppointmentsOverview()
        {
            var appointments = await _unitOfWork.Appointments.FindAll(a => true,
                new[] { nameof(Appointment.Patient), nameof(Appointment.Physician) }).ToListAsync();

            var overview = new
            {
                TotalAppointments = appointments.Count,
                ByStatus = appointments.GroupBy(a => a.Status)
                    .Select(g => new { Status = g.Key.ToString(), Count = g.Count() }),
                ByMonth = appointments.GroupBy(a => new { a.AppointmentDate.Year, a.AppointmentDate.Month })
                    .Select(g => new
                    {
                        Month = $"{g.Key.Year}-{g.Key.Month:D2}",
                        Count = g.Count()
                    })
                    .OrderBy(x => x.Month),
                AverageDuration = appointments.Any() ?
                    appointments.Average(a => (a.EndTime - a.StartTime).TotalMinutes) : 0
            };

            return Ok(overview);
        }

        [HttpGet("revenue/overview")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetRevenueOverview()
        {
            var payments = await _unitOfWork.Payments.FindAll(p => p.Status == "completed",
                new[] { nameof(Payment.Invoice) }).ToListAsync();

            var overview = new
            {
                TotalRevenue = payments.Sum(p => p.Amount),
                AveragePayment = payments.Any() ? payments.Average(p => p.Amount) : 0,
                ByMonth = payments.GroupBy(p => new { p.PaymentDate.Year, p.PaymentDate.Month })
                    .Select(g => new
                    {
                        Month = $"{g.Key.Year}-{g.Key.Month:D2}",
                        Revenue = g.Sum(p => p.Amount),
                        Count = g.Count()
                    })
                    .OrderBy(x => x.Month),
                ByPaymentMethod = payments.GroupBy(p => p.PaymentMethod)
                    .Select(g => new { Method = g.Key, Revenue = g.Sum(p => p.Amount) })
            };

            return Ok(overview);
        }

        [HttpPost("record-metric")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> RecordMetric([FromBody] AnalyticsData metric)
        {
            // This endpoint allows manual recording of metrics
            await _unitOfWork.AnalyticsData.AddAsync(metric);
            await _unitOfWork.SaveDbAsync();

            return Ok(metric);
        }

        [HttpGet("metrics")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetMetrics([FromQuery] AnalyticsQueryDto query)
        {
            var queryable = _unitOfWork.AnalyticsData.FindAll(a => true, Array.Empty<string>());

            if (query.StartDate.HasValue)
                queryable = queryable.Where(a => a.Date >= query.StartDate.Value);

            if (query.EndDate.HasValue)
                queryable = queryable.Where(a => a.Date <= query.EndDate.Value);

            if (!string.IsNullOrEmpty(query.MetricType))
            {
                queryable = queryable.Where(a => a.MetricName.Contains(query.MetricType));
            }

            var metrics = await queryable.OrderByDescending(a => a.Date).ToListAsync();

            return Ok(metrics);
        }

        // Frontend API compatibility endpoints
        [HttpGet("stats")]
        [Authorize]
        public async Task<IActionResult> GetStats()
        {
            try
            {
                var now = DateTime.UtcNow;
                var startOfMonth = new DateTime(now.Year, now.Month, 1);
                var lastMonth = startOfMonth.AddMonths(-1);

                // Current month stats
                var totalPatients = await _unitOfWork.Patients.CountAsync();
                var appointmentsThisMonth = await _unitOfWork.Appointments.CountAsync(a => a.AppointmentDate >= startOfMonth);
                var activePhysicians = await _unitOfWork.Physicians.CountAsync();
                var revenue = (await _unitOfWork.Payments.FindAll(p => p.Status == "completed" && p.PaymentDate >= startOfMonth, Array.Empty<string>()).ToListAsync()).Sum(p => p.Amount);

                // Previous month stats for percentage calculations
                var patientsLastMonth = totalPatients; // Simplified - in real app you'd track historical data
                var appointmentsLastMonth = await _unitOfWork.Appointments.CountAsync(a => a.AppointmentDate >= lastMonth && a.AppointmentDate < startOfMonth);
                var revenueLastMonth = (await _unitOfWork.Payments.FindAll(p => p.Status == "completed" && p.PaymentDate >= lastMonth && p.PaymentDate < startOfMonth, Array.Empty<string>()).ToListAsync()).Sum(p => p.Amount);

                // Calculate percentage changes
                var patientChangePercent = patientsLastMonth > 0 ? ((totalPatients - patientsLastMonth) / (double)patientsLastMonth) * 100 : 0;
                var appointmentChangePercent = appointmentsLastMonth > 0 ? ((appointmentsThisMonth - appointmentsLastMonth) / (double)appointmentsLastMonth) * 100 : 0;
                var revenueChangePercent = revenueLastMonth > 0 ? ((decimal)(revenue - revenueLastMonth) / (decimal)revenueLastMonth) * 100 : 0;
                var physicianChangePercent = 0; // Simplified

                var stats = new
                {
                    totalPatients,
                    appointmentsThisMonth,
                    revenue,
                    activePhysicians,
                    patientChangePercent = Math.Round(patientChangePercent, 1),
                    appointmentChangePercent = Math.Round(appointmentChangePercent, 1),
                    revenueChangePercent = Math.Round(revenueChangePercent, 1),
                    physicianChangePercent
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error fetching stats: {ex.Message}");
            }
        }

        [HttpGet("monthly-trends")]
        [Authorize]
        public async Task<IActionResult> GetMonthlyTrends()
        {
            try
            {
                var monthlyData = new List<object>();
                var now = DateTime.UtcNow;

                for (int i = 11; i >= 0; i--)
                {
                    var monthStart = new DateTime(now.Year, now.Month, 1).AddMonths(-i);
                    var monthEnd = monthStart.AddMonths(1);

                    var patients = 0; // TODO: Add CreatedAt to Patient model
                    var appointments = await _unitOfWork.Appointments.CountAsync(a => a.AppointmentDate >= monthStart && a.AppointmentDate < monthEnd);
                    var revenue = (await _unitOfWork.Payments.FindAll(p => p.Status == "completed" && p.PaymentDate >= monthStart && p.PaymentDate < monthEnd, Array.Empty<string>()).ToListAsync()).Sum(p => p.Amount);

                    monthlyData.Add(new
                    {
                        month = monthStart.ToString("MMM yyyy"),
                        patients,
                        appointments,
                        revenue
                    });
                }

                return Ok(monthlyData);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error fetching monthly trends: {ex.Message}");
            }
        }

        [HttpGet("specialties")]
        [Authorize]
        public async Task<IActionResult> GetSpecialtyDistribution()
        {
            try
            {
                var specialties = await _unitOfWork.Specializations.FindAll(s => true, new[] { nameof(Specialization.Physicians) }).ToListAsync();
                var colors = new[] { "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00", "#ff00ff" };

                var specialtyData = specialties.Select((s, index) => new
                {
                    name = s.Name,
                    value = s.Physicians?.Count ?? 0,
                    color = colors[index % colors.Length]
                });

                return Ok(specialtyData);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error fetching specialty distribution: {ex.Message}");
            }
        }

        [HttpGet("demographics")]
        [Authorize]
        public async Task<IActionResult> GetPatientDemographics()
        {
            try
            {
                var patients = await _unitOfWork.Patients.FindAll(p => true, Array.Empty<string>()).ToListAsync();

                var malePatients = patients.Count(p => p.Gender?.ToLower() == "male");
                var femalePatients = patients.Count(p => p.Gender?.ToLower() == "female");

                var ageGroups = new
                {
                    _18_30 = 0, // TODO: Add DateOfBirth to Patient model
                    _31_50 = 0,
                    _51_70 = 0,
                    _70_plus = 0
                };

                var demographics = new
                {
                    malePatients,
                    femalePatients,
                    ageGroups
                };

                return Ok(demographics);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error fetching demographics: {ex.Message}");
            }
        }

        private int GetAge(DateTime birthDate)
        {
            var today = DateTime.Today;
            var age = today.Year - birthDate.Year;
            if (birthDate.Date > today.AddYears(-age)) age--;
            return age;
        }
    }
}