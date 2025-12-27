using Homecare.Model;

namespace Homecare.Repository
{
    public interface IUnitOfWork:IDisposable
    {
        public IRepository<Patient> Patients { get;  }
        public IRepository<Physician> Physicians { get;  }
        public IRepository<Appointment> Appointments { get; }
        public IRepository<Medication> Medications { get;  }
        public IRepository<Report> Reports { get;  }
        public IRepository<Specialization> Specializations { get;}
        public IRepository<Disease> Diseases { get;}
        public IRepository<PatientDisease> PatientDiseases { get;}
        public IRepository<Feedback> Feedbacks { get;}
        public IRepository<Invoice> Invoices { get; }
        public IRepository<Payment> Payments { get; }
        public IRepository<DicomFile> DicomFiles { get; }
        public IRepository<DicomAnnotation> DicomAnnotations { get; }
        public IRepository<AnalyticsData> AnalyticsData { get; }




        public Task<int> SaveDbAsync();
    }
}
