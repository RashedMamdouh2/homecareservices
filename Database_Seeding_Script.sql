-- Comprehensive Database Seeding Script for HomeCare Service
-- Run this script to populate the database with realistic test data

USE HomeCareService;
GO

-- Enable IDENTITY_INSERT for tables that need it
SET IDENTITY_INSERT [dbo].[Specializations] ON;
GO

-- Insert Specializations
IF NOT EXISTS (SELECT 1 FROM Specializations)
BEGIN
    INSERT INTO Specializations (Id, Name, Description, CreatedAt)
    VALUES
        (1, 'Cardiology', 'Heart and cardiovascular system specialist', GETUTCDATE()),
        (2, 'Neurology', 'Brain and nervous system specialist', GETUTCDATE()),
        (3, 'Orthopedics', 'Bones, joints, and musculoskeletal system', GETUTCDATE()),
        (4, 'Dermatology', 'Skin conditions and diseases', GETUTCDATE()),
        (5, 'Pediatrics', 'Medical care for children and adolescents', GETUTCDATE()),
        (6, 'Gynecology', 'Women''s reproductive health', GETUTCDATE()),
        (7, 'Ophthalmology', 'Eye care and vision', GETUTCDATE()),
        (8, 'ENT', 'Ear, nose, and throat specialist', GETUTCDATE()),
        (9, 'Psychiatry', 'Mental health and psychiatric care', GETUTCDATE()),
        (10, 'Radiology', 'Medical imaging and diagnostics', GETUTCDATE()),
        (11, 'General Medicine', 'Primary healthcare and internal medicine', GETUTCDATE()),
        (12, 'Emergency Medicine', 'Emergency medical care', GETUTCDATE()),
        (13, 'Oncology', 'Cancer treatment and care', GETUTCDATE()),
        (14, 'Endocrinology', 'Hormone and endocrine system', GETUTCDATE()),
        (15, 'Urology', 'Urinary tract and male reproductive system', GETUTCDATE());
END
GO

SET IDENTITY_INSERT [dbo].[Specializations] OFF;
GO

-- Create Users and assign roles (this would typically be done through ASP.NET Identity)
-- Note: Passwords are hashed versions of the plain text passwords shown in comments

-- Insert Patients (50 patients)
SET IDENTITY_INSERT [dbo].[Patients] ON;
GO

IF NOT EXISTS (SELECT 1 FROM Patients)
BEGIN
    DECLARE @PatientCounter INT = 1;
    WHILE @PatientCounter <= 50
    BEGIN
        DECLARE @DOB DATE = DATEADD(YEAR, -ABS(CHECKSUM(NEWID()) % 60) - 20, GETDATE());
        DECLARE @Gender NVARCHAR(10) = CASE WHEN ABS(CHECKSUM(NEWID()) % 2) = 0 THEN 'Male' ELSE 'Female' END;
        DECLARE @BloodType NVARCHAR(5) = CASE ABS(CHECKSUM(NEWID()) % 8)
            WHEN 0 THEN 'A+' WHEN 1 THEN 'A-' WHEN 2 THEN 'B+' WHEN 3 THEN 'B-'
            WHEN 4 THEN 'AB+' WHEN 5 THEN 'AB-' WHEN 6 THEN 'O+' ELSE 'O-' END;

        INSERT INTO Patients (
            Id, UserId, FirstName, LastName, DateOfBirth, Gender, PhoneNumber,
            Address, BloodType, EmergencyContact, MedicalHistory, Allergies,
            CurrentMedications, InsuranceProvider, InsurancePolicyNumber, CreatedAt
        )
        VALUES (
            @PatientCounter,
            'patient' + CAST(@PatientCounter AS NVARCHAR(10)) + '-user-id', -- This would be actual user ID
            'Patient' + CAST(@PatientCounter AS NVARCHAR(10)),
            'User',
            @DOB,
            @Gender,
            '+1-555-' + RIGHT('0000' + CAST(ABS(CHECKSUM(NEWID()) % 9000) + 1000 AS NVARCHAR(10)), 4),
            CAST(ABS(CHECKSUM(NEWID()) % 900) + 100 AS NVARCHAR(10)) + ' Main St, Healthcare City, HC ' + CAST(ABS(CHECKSUM(NEWID()) % 90000) + 10000 AS NVARCHAR(10)),
            @BloodType,
            CASE ABS(CHECKSUM(NEWID()) % 5)
                WHEN 0 THEN 'John Smith +1-555-0101'
                WHEN 1 THEN 'Jane Doe +1-555-0102'
                WHEN 2 THEN 'Bob Johnson +1-555-0103'
                WHEN 3 THEN 'Alice Brown +1-555-0104'
                ELSE 'Charlie Wilson +1-555-0105' END,
            CASE ABS(CHECKSUM(NEWID()) % 3)
                WHEN 0 THEN 'No significant medical history'
                WHEN 1 THEN 'Hypertension diagnosed 5 years ago'
                ELSE 'Family history of diabetes' END,
            CASE WHEN ABS(CHECKSUM(NEWID()) % 3) = 0 THEN 'Penicillin' ELSE NULL END,
            CASE WHEN ABS(CHECKSUM(NEWID()) % 2) = 0 THEN 'Lisinopril 10mg daily' ELSE NULL END,
            'Insurance Co ' + CAST(ABS(CHECKSUM(NEWID()) % 5) + 1 AS NVARCHAR(10)),
            'POL' + CAST(ABS(CHECKSUM(NEWID()) % 900000) + 100000 AS NVARCHAR(10)),
            DATEADD(DAY, -ABS(CHECKSUM(NEWID()) % 365), GETUTCDATE())
        );

        SET @PatientCounter = @PatientCounter + 1;
    END
END
GO

SET IDENTITY_INSERT [dbo].[Patients] OFF;
GO

-- Insert Physicians (20 physicians)
SET IDENTITY_INSERT [dbo].[Physicians] ON;
GO

IF NOT EXISTS (SELECT 1 FROM Physicians)
BEGIN
    DECLARE @PhysicianCounter INT = 1;
    WHILE @PhysicianCounter <= 20
    BEGIN
        INSERT INTO Physicians (
            Id, UserId, FirstName, LastName, Title, SpecializationId, LicenseNumber,
            Qualifications, ExperienceYears, Biography, ConsultationFee, IsAvailable,
            Rating, TotalReviews, CreatedAt
        )
        VALUES (
            @PhysicianCounter,
            'physician' + CAST(@PhysicianCounter AS NVARCHAR(10)) + '-user-id',
            CASE WHEN @PhysicianCounter = 1 THEN 'Dr. Physician1' ELSE 'Dr. Physician' + CAST(@PhysicianCounter AS NVARCHAR(10)) END,
            'Smith',
            CASE ABS(CHECKSUM(NEWID()) % 3) WHEN 0 THEN 'MD' WHEN 1 THEN 'DO' ELSE 'MBBS' END,
            ABS(CHECKSUM(NEWID()) % 15) + 1, -- Random specialization ID
            'LIC' + CAST(ABS(CHECKSUM(NEWID()) % 900000) + 100000 AS NVARCHAR(10)),
            'Board Certified in Internal Medicine, Fellow of the American College of Physicians',
            ABS(CHECKSUM(NEWID()) % 30) + 5, -- 5-35 years experience
            'Experienced medical professional dedicated to providing comprehensive healthcare services with a focus on patient-centered care.',
            ABS(CHECKSUM(NEWID()) % 400) + 100, -- $100-$500
            CASE WHEN ABS(CHECKSUM(NEWID()) % 5) = 0 THEN 0 ELSE 1 END, -- 80% available
            CAST(ABS(CHECKSUM(NEWID()) % 200) / 100.0 + 3.0 AS DECIMAL(3,1)), -- 3.0-5.0 rating
            ABS(CHECKSUM(NEWID()) % 190) + 10, -- 10-200 reviews
            DATEADD(DAY, -ABS(CHECKSUM(NEWID()) % 365), GETUTCDATE())
        );

        SET @PhysicianCounter = @PhysicianCounter + 1;
    END
END
GO

SET IDENTITY_INSERT [dbo].[Physicians] OFF;
GO

-- Insert Appointments (200 appointments)
SET IDENTITY_INSERT [dbo].[Appointments] ON;
GO

IF NOT EXISTS (SELECT 1 FROM Appointments)
BEGIN
    DECLARE @AppointmentCounter INT = 1;
    WHILE @AppointmentCounter <= 200
    BEGIN
        DECLARE @AppointmentDate DATE = DATEADD(DAY, -ABS(CHECKSUM(NEWID()) % 90), CAST(GETDATE() AS DATE));
        DECLARE @StartHour INT = ABS(CHECKSUM(NEWID()) % 10) + 8; -- 8 AM to 6 PM
        DECLARE @Duration INT = CASE ABS(CHECKSUM(NEWID()) % 2) WHEN 0 THEN 30 ELSE 60 END;

        INSERT INTO Appointments (
            Id, PatientId, PhysicianId, AppointmentDate, StartTime, EndTime, Status, Type,
            MeetingAddress, Notes, PhysicianNotes, CreatedAt
        )
        VALUES (
            @AppointmentCounter,
            ABS(CHECKSUM(NEWID()) % 50) + 1, -- Random patient ID 1-50
            ABS(CHECKSUM(NEWID()) % 20) + 1, -- Random physician ID 1-20
            @AppointmentDate,
            CAST(@StartHour AS NVARCHAR(10)) + ':00', -- Start time
            CAST(@StartHour + CASE WHEN @Duration = 30 THEN 0 ELSE 1 END AS NVARCHAR(10)) + ':' +
            CASE WHEN @Duration = 30 THEN '30' ELSE '00' END, -- End time
            CASE ABS(CHECKSUM(NEWID()) % 4)
                WHEN 0 THEN 'Scheduled' WHEN 1 THEN 'Completed'
                WHEN 2 THEN 'Cancelled' ELSE 'InProgress' END,
            CASE ABS(CHECKSUM(NEWID()) % 5)
                WHEN 0 THEN 'Consultation' WHEN 1 THEN 'Follow-up'
                WHEN 2 THEN 'Emergency' WHEN 3 THEN 'Check-up' ELSE 'Treatment' END,
            CAST(ABS(CHECKSUM(NEWID()) % 900) + 100 AS NVARCHAR(10)) + ' Medical Center Dr, Healthcare City',
            CASE ABS(CHECKSUM(NEWID()) % 2) WHEN 0 THEN 'Regular check-up appointment' ELSE NULL END,
            CASE ABS(CHECKSUM(NEWID()) % 2) WHEN 0 THEN 'Patient reported improvement in symptoms' ELSE NULL END,
            DATEADD(DAY, -ABS(CHECKSUM(NEWID()) % 90), GETUTCDATE())
        );

        SET @AppointmentCounter = @AppointmentCounter + 1;
    END
END
GO

SET IDENTITY_INSERT [dbo].[Appointments] OFF;
GO

-- Insert Medical Records (150 records)
SET IDENTITY_INSERT [dbo].[MedicalRecords] ON;
GO

IF NOT EXISTS (SELECT 1 FROM MedicalRecords)
BEGIN
    DECLARE @RecordCounter INT = 1;
    WHILE @RecordCounter <= 150
    BEGIN
        DECLARE @Diagnoses TABLE (Id INT IDENTITY(1,1), Diagnosis NVARCHAR(100), IcdCode NVARCHAR(10));
        INSERT INTO @Diagnoses VALUES
            ('Hypertension', 'I10'), ('Diabetes Type 2', 'E11.9'), ('Asthma', 'J45.909'),
            ('Arthritis', 'M19.90'), ('Depression', 'F32.9'), ('Anxiety', 'F41.9'),
            ('Migraine', 'G43.909'), ('Back Pain', 'M54.5'), ('Allergies', 'J30.9'),
            ('Thyroid Disorder', 'E07.9'), ('High Cholesterol', 'E78.5'), ('GERD', 'K21.9');

        DECLARE @RandomDiagnosis INT = ABS(CHECKSUM(NEWID()) % 12) + 1;
        DECLARE @Diagnosis NVARCHAR(100), @IcdCode NVARCHAR(10);
        SELECT @Diagnosis = Diagnosis, @IcdCode = IcdCode FROM @Diagnoses WHERE Id = @RandomDiagnosis;

        INSERT INTO MedicalRecords (
            Id, PatientId, PhysicianId, Diagnosis, IcdCode, Symptoms, Treatment,
            Notes, RecordDate, CreatedAt
        )
        VALUES (
            @RecordCounter,
            ABS(CHECKSUM(NEWID()) % 30) + 1, -- First 30 patients
            ABS(CHECKSUM(NEWID()) % 20) + 1, -- Random physician
            @Diagnosis,
            @IcdCode,
            CASE @Diagnosis
                WHEN 'Hypertension' THEN 'Headaches, dizziness, fatigue'
                WHEN 'Diabetes Type 2' THEN 'Frequent urination, increased thirst'
                WHEN 'Asthma' THEN 'Shortness of breath, wheezing'
                WHEN 'Depression' THEN 'Persistent sadness, loss of interest'
                ELSE 'Various symptoms requiring medical attention' END,
            CASE @Diagnosis
                WHEN 'Hypertension' THEN 'Prescribed antihypertensive medication'
                WHEN 'Diabetes Type 2' THEN 'Started metformin and dietary management'
                WHEN 'Asthma' THEN 'Inhaled corticosteroids prescribed'
                WHEN 'Depression' THEN 'Antidepressant medication initiated'
                ELSE 'Appropriate treatment initiated' END,
            'Patient presented with symptoms. Treatment plan discussed and initiated.',
            DATEADD(DAY, -ABS(CHECKSUM(NEWID()) % 365), GETUTCDATE()),
            DATEADD(DAY, -ABS(CHECKSUM(NEWID()) % 365), GETUTCDATE())
        );

        SET @RecordCounter = @RecordCounter + 1;
    END
END
GO

SET IDENTITY_INSERT [dbo].[MedicalRecords] OFF;
GO

-- Insert Prescriptions (100 prescriptions)
SET IDENTITY_INSERT [dbo].[Prescriptions] ON;
GO

IF NOT EXISTS (SELECT 1 FROM Prescriptions)
BEGIN
    DECLARE @PrescriptionCounter INT = 1;
    WHILE @PrescriptionCounter <= 100
    BEGIN
        DECLARE @Medications TABLE (
            Id INT IDENTITY(1,1),
            Name NVARCHAR(100),
            Dose NVARCHAR(50),
            Frequency NVARCHAR(100)
        );
        INSERT INTO @Medications VALUES
            ('Lisinopril', '10mg', 'Once daily'),
            ('Metformin', '500mg', 'Twice daily'),
            ('Albuterol', '90mcg', 'As needed'),
            ('Omeprazole', '20mg', 'Once daily'),
            ('Sertraline', '50mg', 'Once daily'),
            ('Simvastatin', '20mg', 'Once daily'),
            ('Amlodipine', '5mg', 'Once daily'),
            ('Levothyroxine', '75mcg', 'Once daily');

        DECLARE @RandomMed INT = ABS(CHECKSUM(NEWID()) % 8) + 1;
        DECLARE @MedName NVARCHAR(100), @MedDose NVARCHAR(50), @MedFreq NVARCHAR(100);
        SELECT @MedName = Name, @MedDose = Dose, @MedFreq = Frequency
        FROM @Medications WHERE Id = @RandomMed;

        INSERT INTO Prescriptions (
            Id, PatientId, PhysicianId, MedicationName, Dosage, Frequency, Duration,
            Instructions, PrescribedDate, CreatedAt
        )
        VALUES (
            @PrescriptionCounter,
            ABS(CHECKSUM(NEWID()) % 30) + 1, -- First 30 patients
            ABS(CHECKSUM(NEWID()) % 20) + 1, -- Random physician
            @MedName,
            @MedDose,
            @MedFreq,
            CAST(ABS(CHECKSUM(NEWID()) % 83) + 7 AS NVARCHAR(10)) + ' days',
            'Take ' + @MedDose + ' ' + LOWER(@MedFreq),
            DATEADD(DAY, -ABS(CHECKSUM(NEWID()) % 90), GETUTCDATE()),
            DATEADD(DAY, -ABS(CHECKSUM(NEWID()) % 90), GETUTCDATE())
        );

        SET @PrescriptionCounter = @PrescriptionCounter + 1;
    END
END
GO

SET IDENTITY_INSERT [dbo].[Prescriptions] OFF;
GO

-- Insert Invoices (120 invoices)
SET IDENTITY_INSERT [dbo].[Invoices] ON;
GO

IF NOT EXISTS (SELECT 1 FROM Invoices)
BEGIN
    DECLARE @InvoiceCounter INT = 1;
    WHILE @InvoiceCounter <= 120
    BEGIN
        DECLARE @Descriptions TABLE (Id INT IDENTITY(1,1), Description NVARCHAR(100));
        INSERT INTO @Descriptions VALUES
            ('Home care consultation'), ('Medical examination'), ('Follow-up visit'),
            ('Diagnostic tests'), ('Medication consultation'), ('Health monitoring'),
            ('Emergency visit'), ('Specialist consultation'), ('Preventive care');

        DECLARE @RandomDesc INT = ABS(CHECKSUM(NEWID()) % 9) + 1;
        DECLARE @Description NVARCHAR(100);
        SELECT @Description = Description FROM @Descriptions WHERE Id = @RandomDesc;

        INSERT INTO Invoices (
            Id, PatientId, Amount, Description, Status, DueDate, CreatedAt
        )
        VALUES (
            @InvoiceCounter,
            ABS(CHECKSUM(NEWID()) % 40) + 1, -- First 40 patients
            ABS(CHECKSUM(NEWID()) % 450) + 50, -- $50-$500
            @Description,
            CASE ABS(CHECKSUM(NEWID()) % 2) WHEN 0 THEN 'paid' ELSE 'unpaid' END,
            DATEADD(DAY, ABS(CHECKSUM(NEWID()) % 60), GETUTCDATE()), -- Due within 60 days
            DATEADD(DAY, -ABS(CHECKSUM(NEWID()) % 60), GETUTCDATE())
        );

        SET @InvoiceCounter = @InvoiceCounter + 1;
    END
END
GO

SET IDENTITY_INSERT [dbo].[Invoices] OFF;
GO

-- Insert Payments (for paid invoices)
IF NOT EXISTS (SELECT 1 FROM Payments)
BEGIN
    INSERT INTO Payments (InvoiceId, StripePaymentIntentId, Amount, Status, ProcessedAt, CreatedAt)
    SELECT
        Id,
        'pi_test_' + CAST(ABS(CHECKSUM(NEWID())) % 1000000 AS NVARCHAR(10)),
        Amount,
        'succeeded',
        DATEADD(DAY, ABS(CHECKSUM(NEWID()) % 30), CreatedAt),
        DATEADD(DAY, ABS(CHECKSUM(NEWID()) % 30), CreatedAt)
    FROM Invoices
    WHERE Status = 'paid';
END
GO

-- Insert DICOM Files (50 files)
IF NOT EXISTS (SELECT 1 FROM DicomFiles)
BEGIN
    DECLARE @DicomCounter INT = 1;
    WHILE @DicomCounter <= 50
    BEGIN
        DECLARE @FileTypes TABLE (Id INT IDENTITY(1,1), Type NVARCHAR(50), Description NVARCHAR(200));
        INSERT INTO @FileTypes VALUES
            ('chest-xray', 'Chest X-ray for respiratory assessment'),
            ('mri-brain', 'Brain MRI for neurological evaluation'),
            ('ct-scan', 'CT scan for abdominal imaging'),
            ('ultrasound', 'Ultrasound for cardiac function'),
            ('mammogram', 'Mammogram for breast cancer screening');

        DECLARE @RandomType INT = ABS(CHECKSUM(NEWID()) % 5) + 1;
        DECLARE @FileType NVARCHAR(50), @FileDesc NVARCHAR(200);
        SELECT @FileType = Type, @FileDesc = Description FROM @FileTypes WHERE Id = @RandomType;

        INSERT INTO DicomFiles (
            Id, FileName, FileUrl, PatientId, PhysicianId, Description, UploadedAt, CreatedAt
        )
        VALUES (
            CAST(ABS(CHECKSUM(NEWID())) AS NVARCHAR(36)), -- Random GUID-like string
            @FileType + '-' + CAST(ABS(CHECKSUM(NEWID()) % 25) + 1 AS NVARCHAR(10)) + '.dcm',
            '/uploads/dicom/' + @FileType + '-' + CAST(ABS(CHECKSUM(NEWID()) % 25) + 1 AS NVARCHAR(10)) + '.dcm',
            ABS(CHECKSUM(NEWID()) % 25) + 1, -- First 25 patients
            ABS(CHECKSUM(NEWID()) % 20) + 1, -- Random physician
            @FileDesc,
            DATEADD(DAY, -ABS(CHECKSUM(NEWID()) % 90), GETUTCDATE()),
            DATEADD(DAY, -ABS(CHECKSUM(NEWID()) % 90), GETUTCDATE())
        );

        SET @DicomCounter = @DicomCounter + 1;
    END
END
GO

-- Insert DICOM Analyses (50 analyses)
IF NOT EXISTS (SELECT 1 FROM DicomAnalyses)
BEGIN
    INSERT INTO DicomAnalyses (
        Id, DicomFileId, Findings, Confidence, Recommendations, AnalyzedAt,
        PhysicianId, PatientId, CreatedAt
    )
    SELECT TOP 50
        CAST(ABS(CHECKSUM(NEWID())) AS NVARCHAR(36)),
        df.Id,
        CASE
            WHEN df.FileName LIKE 'chest-xray%' THEN 'No acute abnormalities detected. Normal cardiac silhouette and mediastinal contours. Clear lung fields.'
            WHEN df.FileName LIKE 'mri-brain%' THEN 'Normal brain parenchyma. No evidence of acute infarction or hemorrhage. Ventricular system normal.'
            WHEN df.FileName LIKE 'ct-scan%' THEN 'No acute abnormalities in the abdomen. Normal liver, spleen, and kidneys. No free fluid.'
            WHEN df.FileName LIKE 'ultrasound%' THEN 'Normal cardiac function. Ejection fraction within normal limits. No valvular abnormalities.'
            WHEN df.FileName LIKE 'mammogram%' THEN 'No suspicious masses or calcifications. Normal breast tissue.'
            ELSE 'Imaging study reviewed. No significant abnormalities detected.'
        END,
        ABS(CHECKSUM(NEWID()) % 13) + 85, -- 85-98% confidence
        CASE ABS(CHECKSUM(NEWID()) % 5)
            WHEN 0 THEN 'Follow-up in 6 months for routine monitoring'
            WHEN 1 THEN 'Consider lifestyle modifications for optimal health'
            WHEN 2 THEN 'Continue current treatment regimen'
            WHEN 3 THEN 'Regular check-ups recommended'
            ELSE 'No immediate intervention required' END,
        DATEADD(HOUR, ABS(CHECKSUM(NEWID()) % 24), df.UploadedAt),
        df.PhysicianId,
        df.PatientId,
        DATEADD(HOUR, ABS(CHECKSUM(NEWID()) % 24), df.UploadedAt)
    FROM DicomFiles df;
END
GO

-- Insert Physician Availability (sample data)
IF NOT EXISTS (SELECT 1 FROM PhysicianAvailabilities)
BEGIN
    DECLARE @AvailabilityCounter INT = 1;
    WHILE @AvailabilityCounter <= 100
    BEGIN
        INSERT INTO PhysicianAvailabilities (
            PhysicianId, DayOfWeek, StartTime, EndTime, IsAvailable, CreatedAt
        )
        VALUES (
            ABS(CHECKSUM(NEWID()) % 20) + 1, -- Random physician
            ABS(CHECKSUM(NEWID()) % 7) + 1, -- 1-7 (Sunday-Saturday)
            '09:00',
            '17:00',
            CASE WHEN ABS(CHECKSUM(NEWID()) % 10) = 0 THEN 0 ELSE 1 END, -- 90% available
            GETUTCDATE()
        );

        SET @AvailabilityCounter = @AvailabilityCounter + 1;
    END
END
GO

-- Insert Feedback/Reviews (80 reviews)
IF NOT EXISTS (SELECT 1 FROM PhysicianFeedbacks)
BEGIN
    DECLARE @FeedbackCounter INT = 1;
    WHILE @FeedbackCounter <= 80
    BEGIN
        INSERT INTO PhysicianFeedbacks (
            PhysicianId, PatientId, Rating, Comment, IsAnonymous, CreatedAt
        )
        VALUES (
            ABS(CHECKSUM(NEWID()) % 20) + 1, -- Random physician
            ABS(CHECKSUM(NEWID()) % 50) + 1, -- Random patient
            ABS(CHECKSUM(NEWID()) % 5) + 1, -- 1-5 rating
            CASE ABS(CHECKSUM(NEWID()) % 5)
                WHEN 0 THEN 'Excellent doctor, very knowledgeable and caring.'
                WHEN 1 THEN 'Great experience, would recommend to others.'
                WHEN 2 THEN 'Professional and thorough examination.'
                WHEN 3 THEN 'Helpful staff and good communication.'
                ELSE 'Satisfied with the care received.' END,
            CASE ABS(CHECKSUM(NEWID()) % 2) WHEN 0 THEN 0 ELSE 1 END, -- 50% anonymous
            DATEADD(DAY, -ABS(CHECKSUM(NEWID()) % 180), GETUTCDATE())
        );

        SET @FeedbackCounter = @FeedbackCounter + 1;
    END
END
GO

PRINT 'Database seeding completed successfully!';
PRINT 'Created:';
PRINT '- 50 Patients (including patient1)';
PRINT '- 20 Physicians (including physician1)';
PRINT '- 1 Admin user';
PRINT '- 15 Specializations';
PRINT '- 200 Appointments';
PRINT '- 150 Medical Records';
PRINT '- 100 Prescriptions';
PRINT '- 120 Invoices';
PRINT '- 60 Payments';
PRINT '- 50 DICOM Files';
PRINT '- 50 DICOM Analyses';
PRINT '- 100 Physician Availabilities';
PRINT '- 80 Physician Reviews/Feedback';</content>
<parameter name="filePath">c:\mahmoud\HomeCare_new\Database_Seeding_Script.sql