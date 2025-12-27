using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HomeCareService.Data
{
    public static class DatabaseSeeder
    {
        public static async Task SeedAsync(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager)
        {
            // Create roles if they don't exist
            await CreateRolesAsync(roleManager);

            // Create users
            var patients = await CreatePatientsAsync(userManager);
            var physicians = await CreatePhysiciansAsync(userManager);
            var admin = await CreateAdminAsync(userManager);

            // Seed data
            await SeedSpecializationsAsync(context);
            await SeedPatientsAsync(context, patients);
            await SeedPhysiciansAsync(context, physicians);
            await SeedAppointmentsAsync(context, patients, physicians);
            await SeedMedicalRecordsAsync(context, patients, physicians);
            await SeedInvoicesAsync(context, patients);
            await SeedPaymentsAsync(context);
            await SeedDicomFilesAsync(context, patients, physicians);
            await SeedDicomAnalysesAsync(context, physicians);
        }

        private static async Task CreateRolesAsync(RoleManager<IdentityRole> roleManager)
        {
            var roles = new[] { "Admin", "Patient", "Physician" };

            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new IdentityRole(role));
                }
            }
        }

        private static async Task<List<ApplicationUser>> CreatePatientsAsync(UserManager<ApplicationUser> userManager)
        {
            var patients = new List<ApplicationUser>();

            // Create patient1 as requested
            var patient1 = await CreateUserAsync(userManager, "patient1@example.com", "Patient@123", "Patient");
            patients.Add(patient1);

            // Create additional patients
            for (int i = 2; i <= 50; i++)
            {
                var patient = await CreateUserAsync(userManager, $"patient{i}@example.com", "Patient@123", "Patient");
                patients.Add(patient);
            }

            return patients;
        }

        private static async Task<List<ApplicationUser>> CreatePhysiciansAsync(UserManager<ApplicationUser> userManager)
        {
            var physicians = new List<ApplicationUser>();

            // Create physician1 as requested
            var physician1 = await CreateUserAsync(userManager, "physician1@example.com", "Physician@123", "Physician");
            physicians.Add(physician1);

            // Create additional physicians
            for (int i = 2; i <= 20; i++)
            {
                var physician = await CreateUserAsync(userManager, $"physician{i}@example.com", "Physician@123", "Physician");
                physicians.Add(physician);
            }

            return physicians;
        }

        private static async Task<ApplicationUser> CreateAdminAsync(UserManager<ApplicationUser> userManager)
        {
            return await CreateUserAsync(userManager, "admin@example.com", "Admin@123", "Admin");
        }

        private static async Task<ApplicationUser> CreateUserAsync(
            UserManager<ApplicationUser> userManager,
            string email,
            string password,
            string role)
        {
            var user = await userManager.FindByEmailAsync(email);
            if (user == null)
            {
                user = new ApplicationUser
                {
                    UserName = email,
                    Email = email,
                    EmailConfirmed = true,
                    FirstName = email.Split('@')[0].Replace("patient", "Patient ").Replace("physician", "Dr. ").Replace("admin", "Admin"),
                    LastName = role,
                    PhoneNumber = $"+1-555-{new Random().Next(1000, 9999)}",
                    DateOfBirth = DateTime.Now.AddYears(-new Random().Next(20, 80)),
                    CreatedAt = DateTime.UtcNow
                };

                var result = await userManager.CreateAsync(user, password);
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(user, role);
                }
            }

            return user;
        }

        private static async Task SeedSpecializationsAsync(ApplicationDbContext context)
        {
            if (!context.Specializations.Any())
            {
                var specializations = new[]
                {
                    "Cardiology", "Neurology", "Orthopedics", "Dermatology", "Pediatrics",
                    "Gynecology", "Ophthalmology", "ENT", "Psychiatry", "Radiology",
                    "General Medicine", "Emergency Medicine", "Oncology", "Endocrinology", "Urology"
                };

                foreach (var spec in specializations)
                {
                    context.Specializations.Add(new Specialization
                    {
                        Name = spec,
                        Description = $"{spec} specialist providing comprehensive care",
                        CreatedAt = DateTime.UtcNow
                    });
                }

                await context.SaveChangesAsync();
            }
        }

        private static async Task SeedPatientsAsync(ApplicationDbContext context, List<ApplicationUser> users)
        {
            if (!context.Patients.Any())
            {
                var random = new Random();
                var bloodTypes = new[] { "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-" };
                var emergencyContacts = new[]
                {
                    "John Smith +1-555-0101", "Jane Doe +1-555-0102", "Bob Johnson +1-555-0103",
                    "Alice Brown +1-555-0104", "Charlie Wilson +1-555-0105"
                };

                foreach (var user in users)
                {
                    var patient = new Patient
                    {
                        UserId = user.Id,
                        FirstName = user.FirstName,
                        LastName = user.LastName,
                        DateOfBirth = user.DateOfBirth.Value,
                        Gender = random.Next(2) == 0 ? "Male" : "Female",
                        PhoneNumber = user.PhoneNumber,
                        Address = $"{random.Next(100, 999)} Main St, City, State {random.Next(10000, 99999)}",
                        BloodType = bloodTypes[random.Next(bloodTypes.Length)],
                        EmergencyContact = emergencyContacts[random.Next(emergencyContacts.Length)],
                        MedicalHistory = GenerateMedicalHistory(),
                        Allergies = random.Next(3) == 0 ? "Penicillin, Shellfish" : null,
                        CurrentMedications = random.Next(2) == 0 ? "Lisinopril 10mg daily, Metformin 500mg twice daily" : null,
                        InsuranceProvider = $"Insurance Co {random.Next(1, 5)}",
                        InsurancePolicyNumber = $"POL{random.Next(100000, 999999)}",
                        CreatedAt = DateTime.UtcNow
                    };

                    context.Patients.Add(patient);
                }

                await context.SaveChangesAsync();
            }
        }

        private static async Task SeedPhysiciansAsync(ApplicationDbContext context, List<ApplicationUser> users)
        {
            if (!context.Physicians.Any())
            {
                var random = new Random();
                var specializations = context.Specializations.ToList();
                var titles = new[] { "MD", "DO", "MBBS" };
                var qualifications = new[]
                {
                    "Board Certified in Internal Medicine",
                    "Fellow of the American College of Physicians",
                    "Specialist in Cardiovascular Diseases",
                    "Certified in Emergency Medicine"
                };

                foreach (var user in users)
                {
                    var physician = new Physician
                    {
                        UserId = user.Id,
                        FirstName = user.FirstName,
                        LastName = user.LastName,
                        Title = titles[random.Next(titles.Length)],
                        SpecializationId = specializations[random.Next(specializations.Count)].Id,
                        LicenseNumber = $"LIC{random.Next(100000, 999999)}",
                        Qualifications = string.Join(", ", qualifications.Take(random.Next(1, 4))),
                        ExperienceYears = random.Next(5, 35),
                        Biography = GeneratePhysicianBiography(),
                        ConsultationFee = random.Next(100, 500),
                        IsAvailable = random.Next(5) != 0, // 80% available
                        Rating = Math.Round(random.NextDouble() * 2 + 3, 1), // 3.0 to 5.0
                        TotalReviews = random.Next(10, 200),
                        CreatedAt = DateTime.UtcNow
                    };

                    context.Physicians.Add(physician);
                }

                await context.SaveChangesAsync();
            }
        }

        private static async Task SeedAppointmentsAsync(
            ApplicationDbContext context,
            List<ApplicationUser> patients,
            List<ApplicationUser> physicians)
        {
            if (!context.Appointments.Any())
            {
                var random = new Random();
                var statuses = new[] { "Scheduled", "Completed", "Cancelled", "InProgress" };
                var appointmentTypes = new[] { "Consultation", "Follow-up", "Emergency", "Check-up", "Treatment" };

                // Create appointments for the last 3 months
                for (int i = 0; i < 200; i++)
                {
                    var patient = patients[random.Next(patients.Count)];
                    var physician = physicians[random.Next(physicians.Count)];
                    var appointmentDate = DateTime.UtcNow.AddDays(-random.Next(90)).Date;
                    var startTime = TimeSpan.FromHours(random.Next(8, 18)); // 8 AM to 6 PM

                    var appointment = new Appointment
                    {
                        PatientId = context.Patients.First(p => p.UserId == patient.Id).Id,
                        PhysicianId = context.Physicians.First(p => p.UserId == physician.Id).Id,
                        AppointmentDate = appointmentDate,
                        StartTime = startTime,
                        EndTime = startTime.Add(TimeSpan.FromMinutes(30 + random.Next(30))), // 30-60 min
                        Status = statuses[random.Next(statuses.Length)],
                        Type = appointmentTypes[random.Next(appointmentTypes.Length)],
                        MeetingAddress = $"{random.Next(100, 999)} Medical Center Dr, Healthcare City",
                        Notes = random.Next(2) == 0 ? "Regular check-up appointment" : "Follow-up consultation",
                        PhysicianNotes = random.Next(2) == 0 ? "Patient reported improvement in symptoms" : null,
                        CreatedAt = DateTime.UtcNow.AddDays(-random.Next(90))
                    };

                    context.Appointments.Add(appointment);
                }

                await context.SaveChangesAsync();
            }
        }

        private static async Task SeedMedicalRecordsAsync(
            ApplicationDbContext context,
            List<ApplicationUser> patients,
            List<ApplicationUser> physicians)
        {
            if (!context.MedicalRecords.Any())
            {
                var random = new Random();
                var diagnoses = new[]
                {
                    "Hypertension", "Diabetes Type 2", "Asthma", "Arthritis", "Depression",
                    "Anxiety", "Migraine", "Back Pain", "Allergies", "Thyroid Disorder",
                    "High Cholesterol", "GERD", "Osteoporosis", "Sleep Apnea", "COPD"
                };

                var icdCodes = new Dictionary<string, string>
                {
                    ["Hypertension"] = "I10",
                    ["Diabetes Type 2"] = "E11.9",
                    ["Asthma"] = "J45.909",
                    ["Arthritis"] = "M19.90",
                    ["Depression"] = "F32.9",
                    ["Anxiety"] = "F41.9",
                    ["Migraine"] = "G43.909",
                    ["Back Pain"] = "M54.5",
                    ["Allergies"] = "J30.9",
                    ["Thyroid Disorder"] = "E07.9",
                    ["High Cholesterol"] = "E78.5",
                    ["GERD"] = "K21.9",
                    ["Osteoporosis"] = "M81.0",
                    ["Sleep Apnea"] = "G47.33",
                    ["COPD"] = "J44.9"
                };

                var medications = new[]
                {
                    new { Name = "Lisinopril", Dose = "10mg", Frequency = "Once daily" },
                    new { Name = "Metformin", Dose = "500mg", Frequency = "Twice daily" },
                    new { Name = "Albuterol", Dose = "90mcg", Frequency = "As needed" },
                    new { Name = "Omeprazole", Dose = "20mg", Frequency = "Once daily" },
                    new { Name = "Sertraline", Dose = "50mg", Frequency = "Once daily" },
                    new { Name = "Simvastatin", Dose = "20mg", Frequency = "Once daily" },
                    new { Name = "Amlodipine", Dose = "5mg", Frequency = "Once daily" },
                    new { Name = "Levothyroxine", Dose = "75mcg", Frequency = "Once daily" }
                };

                foreach (var patientUser in patients.Take(30)) // Seed records for first 30 patients
                {
                    var patient = context.Patients.First(p => p.UserId == patientUser.Id);
                    var physician = context.Physicians.OrderBy(p => Guid.NewGuid()).First();

                    // Create 1-3 medical records per patient
                    for (int i = 0; i < random.Next(1, 4); i++)
                    {
                        var diagnosis = diagnoses[random.Next(diagnoses.Length)];
                        var recordDate = DateTime.UtcNow.AddDays(-random.Next(365));

                        var record = new MedicalRecord
                        {
                            PatientId = patient.Id,
                            PhysicianId = physician.Id,
                            Diagnosis = diagnosis,
                            IcdCode = icdCodes[diagnosis],
                            Symptoms = GenerateSymptoms(diagnosis),
                            Treatment = GenerateTreatment(diagnosis),
                            Notes = $"Patient presented with symptoms of {diagnosis.ToLower()}. Treatment initiated.",
                            RecordDate = recordDate,
                            CreatedAt = recordDate
                        };

                        context.MedicalRecords.Add(record);

                        // Add some prescriptions
                        if (random.Next(2) == 0)
                        {
                            var med = medications[random.Next(medications.Length)];
                            var prescription = new Prescription
                            {
                                PatientId = patient.Id,
                                PhysicianId = physician.Id,
                                MedicationName = med.Name,
                                Dosage = med.Dose,
                                Frequency = med.Frequency,
                                Duration = $"{random.Next(7, 90)} days",
                                Instructions = $"Take {med.Dose} {med.Frequency.ToLower()}",
                                PrescribedDate = recordDate,
                                CreatedAt = recordDate
                            };

                            context.Prescriptions.Add(prescription);
                        }
                    }
                }

                await context.SaveChangesAsync();
            }
        }

        private static async Task SeedInvoicesAsync(ApplicationDbContext context, List<ApplicationUser> patients)
        {
            if (!context.Invoices.Any())
            {
                var random = new Random();
                var descriptions = new[]
                {
                    "Home care consultation", "Medical examination", "Follow-up visit",
                    "Diagnostic tests", "Medication consultation", "Health monitoring",
                    "Emergency visit", "Specialist consultation", "Preventive care"
                };

                foreach (var patientUser in patients.Take(40)) // Create invoices for first 40 patients
                {
                    var patient = context.Patients.First(p => p.UserId == patientUser.Id);

                    // Create 1-3 invoices per patient
                    for (int i = 0; i < random.Next(1, 4); i++)
                    {
                        var amount = random.Next(50, 500);
                        var invoiceDate = DateTime.UtcNow.AddDays(-random.Next(60));

                        var invoice = new Invoice
                        {
                            PatientId = patient.Id,
                            Amount = amount,
                            Description = descriptions[random.Next(descriptions.Length)],
                            Status = random.Next(2) == 0 ? "paid" : "unpaid",
                            DueDate = invoiceDate.AddDays(30),
                            CreatedAt = invoiceDate
                        };

                        context.Invoices.Add(invoice);
                    }
                }

                await context.SaveChangesAsync();
            }
        }

        private static async Task SeedPaymentsAsync(ApplicationDbContext context)
        {
            if (!context.Payments.Any())
            {
                var random = new Random();
                var paidInvoices = context.Invoices.Where(i => i.Status == "paid").ToList();

                foreach (var invoice in paidInvoices)
                {
                    var payment = new Payment
                    {
                        InvoiceId = invoice.Id,
                        StripePaymentIntentId = $"pi_test_{Guid.NewGuid().ToString().Substring(0, 24)}",
                        Amount = invoice.Amount,
                        Status = "succeeded",
                        ProcessedAt = invoice.CreatedAt.AddDays(random.Next(1, 30)),
                        CreatedAt = invoice.CreatedAt.AddDays(random.Next(1, 30))
                    };

                    context.Payments.Add(payment);
                }

                await context.SaveChangesAsync();
            }
        }

        private static async Task SeedDicomFilesAsync(
            ApplicationDbContext context,
            List<ApplicationUser> patients,
            List<ApplicationUser> physicians)
        {
            if (!context.DicomFiles.Any())
            {
                var random = new Random();
                var fileTypes = new[] { "chest-xray", "mri-brain", "ct-scan", "ultrasound", "mammogram" };
                var descriptions = new[]
                {
                    "Chest X-ray for respiratory assessment",
                    "Brain MRI for neurological evaluation",
                    "CT scan for abdominal imaging",
                    "Ultrasound for cardiac function",
                    "Mammogram for breast cancer screening"
                };

                foreach (var patientUser in patients.Take(25)) // DICOM files for first 25 patients
                {
                    var patient = context.Patients.First(p => p.UserId == patientUser.Id);
                    var physician = context.Physicians.OrderBy(p => Guid.NewGuid()).First();

                    // Create 1-2 DICOM files per patient
                    for (int i = 0; i < random.Next(1, 3); i++)
                    {
                        var fileType = fileTypes[random.Next(fileTypes.Length)];
                        var uploadDate = DateTime.UtcNow.AddDays(-random.Next(90));

                        var dicomFile = new DicomFile
                        {
                            Id = Guid.NewGuid().ToString(),
                            FileName = $"{fileType}-{patient.Id}-{i + 1}.dcm",
                            FileUrl = $"/uploads/dicom/{fileType}-{patient.Id}-{i + 1}.dcm",
                            PatientId = patient.Id,
                            PhysicianId = physician.Id,
                            Description = descriptions[Array.IndexOf(fileTypes, fileType)],
                            UploadedAt = uploadDate,
                            CreatedAt = uploadDate
                        };

                        context.DicomFiles.Add(dicomFile);
                    }
                }

                await context.SaveChangesAsync();
            }
        }

        private static async Task SeedDicomAnalysesAsync(ApplicationDbContext context, List<ApplicationUser> physicians)
        {
            if (!context.DicomAnalyses.Any())
            {
                var random = new Random();
                var dicomFiles = context.DicomFiles.ToList();

                foreach (var dicomFile in dicomFiles)
                {
                    var physician = context.Physicians.OrderBy(p => Guid.NewGuid()).First();
                    var analysisDate = dicomFile.UploadedAt.AddHours(random.Next(1, 24));

                    var analysis = new DicomAnalysis
                    {
                        Id = Guid.NewGuid().ToString(),
                        DicomFileId = dicomFile.Id,
                        Findings = GenerateDicomFindings(dicomFile.FileName),
                        Confidence = random.Next(85, 98),
                        Recommendations = GenerateRecommendations(dicomFile.FileName),
                        AnalyzedAt = analysisDate,
                        PhysicianId = physician.Id,
                        PatientId = dicomFile.PatientId,
                        CreatedAt = analysisDate
                    };

                    context.DicomAnalyses.Add(analysis);
                }

                await context.SaveChangesAsync();
            }
        }

        // Helper methods for generating realistic data
        private static string GenerateMedicalHistory()
        {
            var conditions = new[]
            {
                "No significant medical history",
                "Hypertension diagnosed 5 years ago",
                "Type 2 diabetes, well controlled",
                "Previous surgery for appendectomy",
                "Allergic to penicillin",
                "Family history of heart disease",
                "Smoker, 1 pack per day for 20 years",
                "Regular exercise, maintains healthy diet"
            };

            var random = new Random();
            return string.Join(". ", conditions.OrderBy(x => random.Next()).Take(random.Next(1, 4)));
        }

        private static string GeneratePhysicianBiography()
        {
            return "Experienced medical professional dedicated to providing comprehensive healthcare services. " +
                   "Committed to patient-centered care with a focus on preventive medicine and health education.";
        }

        private static string GenerateSymptoms(string diagnosis)
        {
            var symptomMap = new Dictionary<string, string[]>
            {
                ["Hypertension"] = new[] { "Headaches", "Dizziness", "Fatigue" },
                ["Diabetes Type 2"] = new[] { "Frequent urination", "Increased thirst", "Fatigue" },
                ["Asthma"] = new[] { "Shortness of breath", "Wheezing", "Chest tightness" },
                ["Arthritis"] = new[] { "Joint pain", "Stiffness", "Swelling" },
                ["Depression"] = new[] { "Persistent sadness", "Loss of interest", "Sleep disturbances" }
            };

            if (symptomMap.ContainsKey(diagnosis))
            {
                var symptoms = symptomMap[diagnosis];
                return string.Join(", ", symptoms);
            }

            return "Various symptoms requiring medical attention";
        }

        private static string GenerateTreatment(string diagnosis)
        {
            var treatmentMap = new Dictionary<string, string>
            {
                ["Hypertension"] = "Prescribed antihypertensive medication and lifestyle modifications",
                ["Diabetes Type 2"] = "Started metformin and dietary management",
                ["Asthma"] = "Inhaled corticosteroids and bronchodilators prescribed",
                ["Arthritis"] = "NSAIDs and physical therapy recommended",
                ["Depression"] = "Antidepressant medication and counseling initiated"
            };

            return treatmentMap.ContainsKey(diagnosis) ? treatmentMap[diagnosis] : "Appropriate treatment initiated";
        }

        private static string GenerateDicomFindings(string fileName)
        {
            if (fileName.Contains("chest-xray"))
                return "No acute abnormalities detected. Normal cardiac silhouette and mediastinal contours. Clear lung fields.";
            if (fileName.Contains("mri-brain"))
                return "Normal brain parenchyma. No evidence of acute infarction or hemorrhage. Ventricular system normal.";
            if (fileName.Contains("ct-scan"))
                return "No acute abnormalities in the abdomen. Normal liver, spleen, and kidneys. No free fluid.";
            if (fileName.Contains("ultrasound"))
                return "Normal cardiac function. Ejection fraction within normal limits. No valvular abnormalities.";
            if (fileName.Contains("mammogram"))
                return "No suspicious masses or calcifications. Normal breast tissue.";

            return "Imaging study reviewed. No significant abnormalities detected.";
        }

        private static string GenerateRecommendations(string fileName)
        {
            var recommendations = new[]
            {
                "Follow-up in 6 months for routine monitoring",
                "Consider lifestyle modifications for optimal health",
                "Continue current treatment regimen",
                "Regular check-ups recommended",
                "No immediate intervention required"
            };

            return recommendations[new Random().Next(recommendations.Length)];
        }
    }
}</content>
<parameter name="filePath">c:\mahmoud\HomeCare_new\DatabaseSeeder.cs