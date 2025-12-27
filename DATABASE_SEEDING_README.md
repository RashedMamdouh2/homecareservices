# Database Seeding Guide

This guide explains how to populate your HomeCare Service database with comprehensive test data.

## 📊 What Gets Created

The seeding scripts create realistic test data including:

- **50 Patients** (including `patient1@example.com`)
- **20 Physicians** (including `physician1@example.com`)
- **1 Admin User** (`admin@example.com`)
- **15 Medical Specializations**
- **200 Appointments** (past and future)
- **150 Medical Records** with ICD-10 codes
- **100 Prescriptions**
- **120 Invoices** ($50-$500 each)
- **60 Payments** (for paid invoices)
- **50 DICOM Files** (X-rays, MRIs, CT scans, etc.)
- **50 DICOM Analyses** with AI findings
- **100 Physician Availability Slots**
- **80 Patient Reviews/Feedback**

## 🚀 Seeding Methods

### Method 1: C# Seeder Class (Recommended)

1. **Add the DatabaseSeeder.cs file** to your backend project
2. **Update your Program.cs or Startup.cs** using the code from `Seeding_Integration.cs`
3. **Run the application** - data will be seeded automatically in development

### Method 2: SQL Script

1. **Open SQL Server Management Studio** or your database tool
2. **Connect to your HomeCareService database**
3. **Run the `Database_Seeding_Script.sql`** file
4. **Verify the data** was inserted correctly

### Method 3: API Endpoint

If you added the seeding endpoint from `Seeding_Integration.cs`:

1. **Start your backend application**
2. **Make a POST request** to `/api/admin/seed-database`
3. **Use admin credentials** for authentication

## 🔑 Default User Credentials

After seeding, you can log in with these accounts:

### Admin
- **Email:** `admin@example.com`
- **Password:** `Admin@123`

### Physician1 (as requested)
- **Email:** `physician1@example.com`
- **Password:** `Physician@123`

### Patient1 (as requested)
- **Email:** `patient1@example.com`
- **Password:** `Patient@123`

### Additional Users
- **Patients:** `patient2@example.com` through `patient50@example.com`
- **Physicians:** `physician2@example.com` through `physician20@example.com`
- **All passwords:** `Patient@123` for patients, `Physician@123` for physicians

## 📈 Sample Data Features

### Realistic Medical Data
- **ICD-10 Codes:** Proper medical coding for diagnoses
- **Medications:** Real medication names with dosages
- **Vital Signs:** Realistic medical measurements
- **Medical History:** Comprehensive patient backgrounds

### Business Logic
- **Invoice Status:** Mix of paid/unpaid invoices
- **Appointment Types:** Various consultation types
- **Payment Processing:** Stripe-compatible payment data
- **Ratings & Reviews:** Physician reputation system

### Analytics Ready
- **Time Series Data:** 90 days of historical data
- **Geographic Distribution:** Various locations
- **Demographic Data:** Age, gender, insurance info
- **Performance Metrics:** Appointment completion rates

## 🔍 Data Verification

After seeding, verify the data:

```sql
-- Check record counts
SELECT 'Patients' as TableName, COUNT(*) as Count FROM Patients
UNION ALL
SELECT 'Physicians', COUNT(*) FROM Physicians
UNION ALL
SELECT 'Appointments', COUNT(*) FROM Appointments
UNION ALL
SELECT 'Invoices', COUNT(*) FROM Invoices
UNION ALL
SELECT 'DicomFiles', COUNT(*) FROM DicomFiles;
```

## 🧹 Cleanup (Optional)

To remove all seeded data:

```sql
-- WARNING: This will delete all data!
DELETE FROM PhysicianFeedbacks;
DELETE FROM PhysicianAvailabilities;
DELETE FROM DicomAnalyses;
DELETE FROM DicomFiles;
DELETE FROM Payments;
DELETE FROM Invoices;
DELETE FROM Prescriptions;
DELETE FROM MedicalRecords;
DELETE FROM Appointments;
DELETE FROM Physicians;
DELETE FROM Patients;
DELETE FROM Specializations;
```

## 🎯 Testing Scenarios

With this seeded data, you can test:

- **Patient Portal:** Login as patient1, view appointments, medical records
- **Physician Dashboard:** Login as physician1, manage appointments, view DICOM files
- **Admin Panel:** Login as admin, generate bills, view analytics
- **Payment Processing:** Test Stripe integration with existing invoices
- **Analytics:** View comprehensive reports and charts
- **Search & Filter:** Test all search and filtering functionality

## 📞 Support

If you encounter issues with seeding:

1. **Check database permissions**
2. **Verify foreign key constraints**
3. **Ensure Identity tables exist** (AspNetUsers, AspNetRoles, etc.)
4. **Check for duplicate data** before running scripts

The seeded data provides a complete testing environment for your HomeCare Service application! 🏥</content>
<parameter name="filePath">c:\mahmoud\HomeCare_new/DATABASE_SEEDING_README.md