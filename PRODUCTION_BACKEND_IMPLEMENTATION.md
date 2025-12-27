# Production Backend API Implementation Guide

This document outlines all the backend API endpoints required for the production-ready healthcare system.

## 📋 Required API Endpoints

### 1. Payment & Billing APIs

#### GET /api/payments/invoices
Returns invoices for the authenticated user.

**Response:**
```json
[
  {
    "id": 1,
    "date": "2025-12-01",
    "amount": 150.00,
    "status": "unpaid",
    "description": "Home care visit - December 2025",
    "patientId": 1,
    "patientName": "John Doe"
  }
]
```

#### POST /api/payments/create-intent
Creates a Stripe payment intent for an invoice.

**Request:**
```json
{
  "invoiceId": 1
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx",
  "amount": 15000,
  "currency": "usd"
}
```

#### POST /api/payments/confirm
Confirms a successful payment and updates invoice status.

**Request:**
```json
{
  "paymentIntentId": "pi_xxx",
  "status": "succeeded",
  "amount": 15000
}
```

#### POST /api/payments/generate-bill (Admin only)
Generates a new bill/invoice.

**Request:**
```json
{
  "patientId": 1,
  "amount": 150.00,
  "description": "Home care services",
  "dueDate": "2025-12-31T00:00:00Z"
}
```

#### GET /api/payments/history
Returns payment history for the authenticated user.

### 2. DICOM & Medical Imaging APIs

#### POST /api/dicom/upload
Uploads a DICOM file for processing.

**Request:** Multipart form data with `file` field containing DICOM file.

**Response:**
```json
{
  "id": "dicom-123",
  "fileName": "chest-xray.dcm",
  "fileUrl": "/uploads/dicom/dicom-123.dcm",
  "uploadedAt": "2025-12-27T10:30:00Z"
}
```

#### POST /api/dicom/analyze/{dicomId}
Analyzes a DICOM file using AI/CDSS.

**Response:**
```json
{
  "id": "analysis-456",
  "fileName": "chest-xray.dcm",
  "findings": "No acute abnormalities detected. Normal cardiac silhouette.",
  "confidence": 95,
  "recommendations": "Follow-up in 6 months. Consider lifestyle modifications.",
  "analyzedAt": "2025-12-27T10:35:00Z",
  "physicianId": 2,
  "patientId": 1
}
```

#### GET /api/dicom/analyses
Returns analysis history for the authenticated user.

#### GET /api/dicom/patient/{patientId}
Returns DICOM files for a specific patient.

### 3. Analytics & Reports APIs

#### GET /api/analytics/stats
Returns dashboard statistics.

**Response:**
```json
{
  "totalPatients": 1234,
  "appointmentsThisMonth": 456,
  "revenue": 45678,
  "activePhysicians": 89,
  "patientChangePercent": 12.5,
  "appointmentChangePercent": 8.3,
  "revenueChangePercent": 15.2,
  "physicianChangePercent": 5.1
}
```

#### GET /api/analytics/monthly-trends
Returns monthly trends data.

**Response:**
```json
[
  {
    "month": "Jan",
    "patients": 120,
    "appointments": 340,
    "revenue": 12000
  }
]
```

#### GET /api/analytics/specialties
Returns specialty distribution data.

**Response:**
```json
[
  {
    "name": "Cardiology",
    "value": 30,
    "color": "#8884d8"
  }
]
```

#### GET /api/analytics/demographics
Returns patient demographics.

**Response:**
```json
{
  "malePatients": 650,
  "femalePatients": 584,
  "ageGroups": {
    "18-30": 307,
    "31-50": 429,
    "51-70": 360,
    "70+": 138
  }
}
```

## 🔧 Backend Implementation Steps

### 1. Database Schema Updates

Add the following tables to your database:

```sql
-- Payments and Billing
CREATE TABLE Invoices (
    Id INT PRIMARY KEY IDENTITY,
    PatientId INT NOT NULL,
    Amount DECIMAL(10,2) NOT NULL,
    Description NVARCHAR(500),
    Status NVARCHAR(20) DEFAULT 'unpaid',
    DueDate DATETIME2,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE Payments (
    Id INT PRIMARY KEY IDENTITY,
    InvoiceId INT NOT NULL,
    StripePaymentIntentId NVARCHAR(100),
    Amount DECIMAL(10,2) NOT NULL,
    Status NVARCHAR(20),
    ProcessedAt DATETIME2,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);

-- DICOM and Medical Imaging
CREATE TABLE DicomFiles (
    Id NVARCHAR(50) PRIMARY KEY,
    FileName NVARCHAR(255) NOT NULL,
    FileUrl NVARCHAR(500),
    PatientId INT,
    PhysicianId INT,
    UploadedAt DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE DicomAnalyses (
    Id NVARCHAR(50) PRIMARY KEY,
    DicomFileId NVARCHAR(50) NOT NULL,
    Findings NVARCHAR(MAX),
    Confidence DECIMAL(5,2),
    Recommendations NVARCHAR(MAX),
    AnalyzedAt DATETIME2 DEFAULT GETUTCDATE(),
    PhysicianId INT,
    PatientId INT
);

-- Analytics (if not using computed views)
-- You might want to create stored procedures or views for analytics
```

### 2. Stripe Integration Setup

```csharp
// In your Startup.cs or Program.cs
builder.Services.AddScoped<IPaymentService, StripePaymentService>();

// Configure Stripe
var stripeSettings = builder.Configuration.GetSection("Stripe");
StripeConfiguration.ApiKey = stripeSettings["SecretKey"];
```

### 3. Controller Implementations

#### PaymentsController.cs
```csharp
[ApiController]
[Route("api/payments")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly IInvoiceService _invoiceService;

    [HttpGet("invoices")]
    public async Task<IActionResult> GetInvoices()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var invoices = await _invoiceService.GetUserInvoicesAsync(userId);
        return Ok(invoices);
    }

    [HttpPost("create-intent")]
    public async Task<IActionResult> CreatePaymentIntent([FromBody] CreatePaymentIntentRequest request)
    {
        var paymentIntent = await _paymentService.CreatePaymentIntentAsync(request.InvoiceId);
        return Ok(new {
            clientSecret = paymentIntent.ClientSecret,
            paymentIntentId = paymentIntent.Id,
            amount = paymentIntent.Amount,
            currency = paymentIntent.Currency
        });
    }

    [HttpPost("confirm")]
    public async Task<IActionResult> ConfirmPayment([FromBody] ConfirmPaymentRequest request)
    {
        await _paymentService.ConfirmPaymentAsync(request);
        return Ok();
    }

    [HttpPost("generate-bill")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GenerateBill([FromBody] GenerateBillRequest request)
    {
        var invoice = await _invoiceService.GenerateBillAsync(request);
        return Ok(invoice);
    }
}
```

#### DicomController.cs
```csharp
[ApiController]
[Route("api/dicom")]
[Authorize]
public class DicomController : ControllerBase
{
    private readonly IDicomService _dicomService;
    private readonly IAnalysisService _analysisService;

    [HttpPost("upload")]
    public async Task<IActionResult> UploadDicom(IFormFile file)
    {
        var result = await _dicomService.UploadDicomAsync(file);
        return Ok(result);
    }

    [HttpPost("analyze/{dicomId}")]
    public async Task<IActionResult> AnalyzeDicom(string dicomId)
    {
        var result = await _analysisService.AnalyzeDicomAsync(dicomId);
        return Ok(result);
    }

    [HttpGet("analyses")]
    public async Task<IActionResult> GetAnalyses()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var analyses = await _analysisService.GetUserAnalysesAsync(userId);
        return Ok(analyses);
    }
}
```

#### AnalyticsController.cs
```csharp
[ApiController]
[Route("api/analytics")]
[Authorize]
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analyticsService;

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var stats = await _analyticsService.GetDashboardStatsAsync();
        return Ok(stats);
    }

    [HttpGet("monthly-trends")]
    public async Task<IActionResult> GetMonthlyTrends()
    {
        var trends = await _analyticsService.GetMonthlyTrendsAsync();
        return Ok(trends);
    }

    [HttpGet("specialties")]
    public async Task<IActionResult> GetSpecialtyDistribution()
    {
        var specialties = await _analyticsService.GetSpecialtyDistributionAsync();
        return Ok(specialties);
    }

    [HttpGet("demographics")]
    public async Task<IActionResult> GetPatientDemographics()
    {
        var demographics = await _analyticsService.GetPatientDemographicsAsync();
        return Ok(demographics);
    }
}
```

### 4. Service Implementations

#### IPaymentService.cs & StripePaymentService.cs
```csharp
public interface IPaymentService
{
    Task<PaymentIntent> CreatePaymentIntentAsync(int invoiceId);
    Task ConfirmPaymentAsync(ConfirmPaymentRequest request);
}

public class StripePaymentService : IPaymentService
{
    public async Task<PaymentIntent> CreatePaymentIntentAsync(int invoiceId)
    {
        var invoice = await _invoiceRepository.GetByIdAsync(invoiceId);

        var options = new PaymentIntentCreateOptions
        {
            Amount = (long)(invoice.Amount * 100), // Convert to cents
            Currency = "usd",
            PaymentMethodTypes = new List<string> { "card" },
            Metadata = new Dictionary<string, string>
            {
                { "invoice_id", invoice.Id.ToString() }
            }
        };

        var service = new PaymentIntentService();
        return await service.CreateAsync(options);
    }

    public async Task ConfirmPaymentAsync(ConfirmPaymentRequest request)
    {
        // Update invoice status
        var invoice = await _invoiceRepository.GetByIdAsync(request.InvoiceId);
        invoice.Status = "paid";
        await _invoiceRepository.UpdateAsync(invoice);

        // Record payment
        var payment = new Payment
        {
            InvoiceId = request.InvoiceId,
            StripePaymentIntentId = request.PaymentIntentId,
            Amount = request.Amount / 100m, // Convert from cents
            Status = request.Status,
            ProcessedAt = DateTime.UtcNow
        };
        await _paymentRepository.AddAsync(payment);
    }
}
```

### 5. AI/CDSS Integration

For DICOM analysis, integrate with medical AI services:

```csharp
public class MedicalAnalysisService : IAnalysisService
{
    public async Task<DicomAnalysisResult> AnalyzeDicomAsync(string dicomId)
    {
        // Load DICOM file
        var dicomFile = await _dicomRepository.GetByIdAsync(dicomId);

        // Call AI service (e.g., Azure AI Health Insights, custom ML model, etc.)
        var analysisResult = await _aiService.AnalyzeMedicalImageAsync(dicomFile.FileUrl);

        // Save analysis
        var analysis = new DicomAnalysis
        {
            Id = Guid.NewGuid().ToString(),
            DicomFileId = dicomId,
            Findings = analysisResult.Findings,
            Confidence = analysisResult.Confidence,
            Recommendations = analysisResult.Recommendations,
            AnalyzedAt = DateTime.UtcNow,
            PhysicianId = GetCurrentUserId(),
            PatientId = dicomFile.PatientId
        };

        await _analysisRepository.AddAsync(analysis);
        return analysis;
    }
}
```

## 🔐 Security Considerations

1. **File Upload Security:**
   - Validate file types and sizes
   - Scan for malware
   - Store files securely with access controls

2. **Payment Security:**
   - Use Stripe's PCI-compliant elements
   - Never store card details on your server
   - Implement webhook signature verification

3. **Data Privacy:**
   - Encrypt sensitive medical data
   - Implement proper access controls
   - Comply with HIPAA/GDPR regulations

4. **API Security:**
   - Use JWT tokens for authentication
   - Implement role-based authorization
   - Rate limiting and input validation

## 📊 Analytics Implementation

For analytics, you can either:
1. **Real-time queries:** Calculate stats on-demand from database
2. **Cached data:** Pre-calculate and cache analytics data
3. **Data warehouse:** Use a separate analytics database

Example implementation:
```csharp
public class AnalyticsService : IAnalyticsService
{
    public async Task<DashboardStats> GetDashboardStatsAsync()
    {
        var totalPatients = await _patientRepository.CountAsync();
        var appointmentsThisMonth = await _appointmentRepository.CountThisMonthAsync();
        var revenue = await _paymentRepository.SumRevenueAsync();
        var activePhysicians = await _physicianRepository.CountActiveAsync();

        // Calculate percentage changes (compare with previous period)
        var patientChange = await CalculateChangePercentAsync("patients");
        var appointmentChange = await CalculateChangePercentAsync("appointments");
        var revenueChange = await CalculateChangePercentAsync("revenue");
        var physicianChange = await CalculateChangePercentAsync("physicians");

        return new DashboardStats
        {
            TotalPatients = totalPatients,
            AppointmentsThisMonth = appointmentsThisMonth,
            Revenue = revenue,
            ActivePhysicians = activePhysicians,
            PatientChangePercent = patientChange,
            AppointmentChangePercent = appointmentChange,
            RevenueChangePercent = revenueChange,
            PhysicianChangePercent = physicianChange
        };
    }
}
```

## 🚀 Deployment Checklist

- [ ] Set up Stripe account and API keys
- [ ] Configure database with new tables
- [ ] Implement all API controllers
- [ ] Set up file storage for DICOM files
- [ ] Configure AI/CDSS service integration
- [ ] Set up webhook endpoints for Stripe
- [ ] Configure environment variables
- [ ] Test all endpoints thoroughly
- [ ] Set up monitoring and logging
- [ ] Implement backup and recovery procedures

## 🔧 Environment Variables

```env
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Database
CONNECTION_STRING=...

# File Storage
DICOM_STORAGE_PATH=/uploads/dicom
MAX_FILE_SIZE=10485760

# AI Service
AI_SERVICE_ENDPOINT=...
AI_SERVICE_KEY=...
```

This implementation provides a complete production-ready backend for your healthcare system with secure payments, medical imaging, and comprehensive analytics.</content>
<parameter name="filePath">c:\mahmoud\HomeCare_new\PRODUCTION_BACKEND_IMPLEMENTATION.md