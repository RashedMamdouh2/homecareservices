using Homecare.Model;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Homecare.Repository
{
    public class UnitOfWork:IUnitOfWork
    {
        private readonly ApplicationDbContext context;
        public IRepository<Patient> Patients { get; private set; }
        public IRepository<Physician> Physicians { get; private set; }
        public IRepository<Appointment> Appointments { get;private set; }
        public IRepository<Medication> Medications { get;private set; }
        public IRepository<Report> Reports { get;private set; }
        public IRepository<Specialization> Specializations { get;private set; }
        public IRepository<Disease> Diseases { get;private set; }
        public IRepository<PatientDisease> PatientDiseases { get;private set; }
        public IRepository<Feedback> Feedbacks { get;private set; }
        public IRepository<Invoice> Invoices { get; private set; }
        public IRepository<Payment> Payments { get; private set; }
        public IRepository<DicomFile> DicomFiles { get; private set; }
        public IRepository<DicomAnnotation> DicomAnnotations { get; private set; }
        public IRepository<AnalyticsData> AnalyticsData { get; private set; }
        public IRepository<ApplicationUser> ApplicationUsers { get; private set; }


        public UnitOfWork(ApplicationDbContext context)
        {
            this.context = context;
            Patients       = new Repository<Patient>(context);
            Physicians      = new Repository<Physician>(context);
            Appointments    = new Repository<Appointment>(context);
            Medications     = new Repository<Medication>(context);
            Reports         = new Repository<Report>(context);
            Specializations = new Repository<Specialization>(context);
            Diseases = new Repository<Disease>(context);
            PatientDiseases = new Repository<PatientDisease>(context);
            Feedbacks = new Repository<Feedback>(context);
            Invoices = new Repository<Invoice>(context);
            Payments = new Repository<Payment>(context);
            DicomFiles = new Repository<DicomFile>(context);
            DicomAnnotations = new Repository<DicomAnnotation>(context);
            AnalyticsData = new Repository<AnalyticsData>(context);
            ApplicationUsers = new Repository<ApplicationUser>(context);
        }
        public async Task<int> SaveDbAsync()
        {
            return await context.SaveChangesAsync();
        }
        public void Dispose()
        {
           context.Dispose();
        }
    }
}
