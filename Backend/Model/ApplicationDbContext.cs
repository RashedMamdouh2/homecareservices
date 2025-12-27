using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Homecare.Model
{
    public class ApplicationDbContext :IdentityDbContext<ApplicationUser>
    {
        public DbSet<Patient> Patients { get; set; }
        public DbSet<Physician> Physicians { get; set; }
        public DbSet<Appointment> Appointements { get; set; }
        public DbSet<Medication> Medication { get; set; }
        public DbSet<Subscription> Subscriptions { get; set; }
        public DbSet<Report> Reports { get; set; }
        public DbSet<Specialization> Specializations { get; set; }
        public DbSet<Disease> Diseases { get; set; }
        public DbSet<PatientDisease> PatientDiseases { get; set; }
        public DbSet<Feedback> Feedback { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<DicomFile> DicomFiles { get; set; }
        public DbSet<DicomAnnotation> DicomAnnotations { get; set; }
        public DbSet<AnalyticsData> AnalyticsData { get; set; }
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) :base(options)
        {
            
        }
    }
 
}
