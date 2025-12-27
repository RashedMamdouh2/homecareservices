import { getAuthToken } from "@/contexts/AuthContext";

const BASE_URL = import.meta.env.VITE_API_URL || "https://homecareservice.runasp.net/api";
const ASSET_BASE_URL = import.meta.env.VITE_ASSET_URL || "https://homecareservice.runasp.net";

// Helper to construct full URL for images and PDFs
export const getAssetUrl = (path: string | undefined): string | null => {
  if (!path) return null;
  // If it's already a full URL, return as is
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  // If it's a relative path, prepend the base URL
  return `${ASSET_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

// Helper to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Types
export interface MedicationDto {
  name: string;
  description?: string;
  doseFrequency?: number;
  dose?: number;
  usageTimes?: string[];
}

export interface AppointmentSendDto {
  id: string;
  startTime: string;
  endTime: string;
  meetingAddress: string;
  appointmentDate: string;
  patientId: number;
  patientName: string;
  physicianId: number;
  physicianName: string;
  physicianNotes: string;
  medications: MedicationDto[];
  pdfBase64?: string;
}

export interface AppointmentCreateDto {
  appointmentDate: string;
  startTime: string;
  endTime: string;
  patientId: number;
  physicianId: number;
  meetingAddress: string;
  physicianNotes: string;
}

export interface PhysicianSendDto {
  id: number;
  name: string;
  clinicalAddress: string;
  specializationName: string;
  image?: string;
  sessionPrice?: number;
}

export interface StripePaymentDto {
  patientUserId: string;
  customerEmail: string;
  sessionPrice: number;
  successUrl: string;
  cancelUrl: string;
}

export interface StripePaymentResponse {
  redirectUrl: string;
}

export interface PhysicianCreateDto {
  name: string;
  clinicalAddress: string;
  specializationId: number;
  image: File;
}

export interface PatientSendDto {
  id: number;
  name: string;
  phone: string;
  address: string;
  city: string;
  gender: string;
  subscriptionId?: number;
  image?: string;
}

export interface PatientCreateDto {
  name: string;
  phone: string;
  address: string;
  city: string;
  gender: string;
  subscriptionId: number;
  image: File;
}

export interface SpecializationDto {
  id: number;
  name: string;
  description?: string;
}

export interface SpecializationCreateDto {
  id: number;
  name: string;
  description: string;
}

// API Functions
export interface ReportMedicationDto {
  name: string;
  description: string;
  doseFrequency: number;
  dose: number;
  usageTimes: string[];
}

export interface ReportCreateDto {
  descritpion: string;
  patientId: number;
  physicianId: number;
  medications: ReportMedicationDto[];
}

export const appointmentsApi = {
  getAll: async (): Promise<AppointmentSendDto[]> => {
    const res = await fetch(`${BASE_URL}/appointments/GetAllAppointments`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch appointments");
    return res.json();
  },

  getByPatient: async (patientId: number): Promise<AppointmentSendDto[]> => {
    const res = await fetch(`${BASE_URL}/Patient/GetPatientAppointments/${patientId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch patient appointments");
    return res.json();
  },

  getByPhysician: async (physicianId: number): Promise<AppointmentSendDto[]> => {
    const res = await fetch(`${BASE_URL}/Physician/GetPhysicianAppointments/${physicianId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch physician appointments");
    return res.json();
  },
  
  getById: async (id: string): Promise<AppointmentSendDto> => {
    const res = await fetch(`${BASE_URL}/appointments/GetAppointment/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch appointment");
    return res.json();
  },
  
  create: async (data: AppointmentCreateDto): Promise<void> => {
    const res = await fetch(`${BASE_URL}/appointments/BookAppointment`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to book appointment");
  },

  update: async (id: string, data: AppointmentCreateDto): Promise<void> => {
    const res = await fetch(`${BASE_URL}/appointments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update appointment");
  },

  delete: async (id: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/appointments/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete appointment");
  },

  addReport: async (appointmentId: string, data: ReportCreateDto): Promise<string> => {
    const res = await fetch(`${BASE_URL}/Appointments/Add/Appointment/Report/${appointmentId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to add report");
    const result = await res.json();
    return result.pdfBase64;
  },
};

export const physiciansApi = {
  getAll: async (): Promise<PhysicianSendDto[]> => {
    const res = await fetch(`${BASE_URL}/physician/GetAllPhysicians`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch physicians");
    return res.json();
  },
  
  getById: async (id: number): Promise<PhysicianSendDto> => {
    const res = await fetch(`${BASE_URL}/physician/GetPhysician/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch physician");
    return res.json();
  },

  create: async (data: PhysicianCreateDto): Promise<void> => {
    const formData = new FormData();
    formData.append("Name", data.name);
    formData.append("SpecializationId", data.specializationId.toString());
    formData.append("ClinicalAddress", data.clinicalAddress);
    formData.append("Image", data.image);
    
    const res = await fetch(`${BASE_URL}/physician/AddPhysician`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to add physician");
  },

  update: async (id: number, data: Partial<PhysicianCreateDto>): Promise<void> => {
    const formData = new FormData();
    formData.append("id", id.toString());
    if (data.name) formData.append("Name", data.name);
    if (data.specializationId) formData.append("SpecializationId", data.specializationId.toString());
    if (data.clinicalAddress) formData.append("ClinicalAddress", data.clinicalAddress);
    if (data.image) formData.append("Image", data.image);
    
    const res = await fetch(`${BASE_URL}/physician/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to update physician");
  },

  delete: async (id: number): Promise<void> => {
    const res = await fetch(`${BASE_URL}/physician/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete physician");
  },
};

export const patientsApi = {
  getAll: async (): Promise<PatientSendDto[]> => {
    const res = await fetch(`${BASE_URL}/patient/GetAllPatients`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch patients");
    return res.json();
  },
  
  getById: async (id: number): Promise<PatientSendDto> => {
    const res = await fetch(`${BASE_URL}/patient/GetPatient/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch patient");
    return res.json();
  },

  create: async (data: PatientCreateDto): Promise<void> => {
    const formData = new FormData();
    formData.append("Name", data.name);
    formData.append("Phone", data.phone);
    formData.append("Gender", data.gender);
    formData.append("Address", data.address);
    formData.append("City", data.city);
    formData.append("SubscriptionId", data.subscriptionId.toString());
    formData.append("Image", data.image);
    
    const res = await fetch(`${BASE_URL}/patient/AddPatient`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to add patient");
  },

  update: async (id: number, data: Partial<PatientCreateDto>): Promise<void> => {
    const formData = new FormData();
    formData.append("id", id.toString());
    if (data.name) formData.append("Name", data.name);
    if (data.phone) formData.append("Phone", data.phone);
    if (data.gender) formData.append("Gender", data.gender);
    if (data.address) formData.append("Address", data.address);
    if (data.city) formData.append("City", data.city);
    if (data.subscriptionId !== undefined) formData.append("SubscriptionId", data.subscriptionId.toString());
    if (data.image) formData.append("Image", data.image);
    
    const res = await fetch(`${BASE_URL}/patient/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to update patient");
  },

  delete: async (id: number): Promise<void> => {
    const res = await fetch(`${BASE_URL}/patient/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete patient");
  },
};

export const specializationsApi = {
  getAll: async (): Promise<SpecializationDto[]> => {
    const res = await fetch(`${BASE_URL}/specialization/GetAllSpecializations`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch specializations");
    return res.json();
  },

  getPhysicians: async (specializationId: number): Promise<PhysicianSendDto[]> => {
    const res = await fetch(`${BASE_URL}/specialization/GetPhysicians/${specializationId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch physicians for specialization");
    return res.json();
  },

  create: async (data: SpecializationCreateDto): Promise<void> => {
    const res = await fetch(`${BASE_URL}/specialization/AddSpecialization`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to add specialization");
  },

  update: async (id: number, data: Partial<SpecializationCreateDto>): Promise<void> => {
    const res = await fetch(`${BASE_URL}/specialization/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ id, ...data }),
    });
    if (!res.ok) throw new Error("Failed to update specialization");
  },

  delete: async (id: number): Promise<void> => {
    const res = await fetch(`${BASE_URL}/specialization/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete specialization");
  },
};

export interface AvailableHoursDto {
  availableSlots: string[];
}

export interface PatientDiseaseDto {
  diagnosisDate: string;
  icd: string;
  patientId: number;
  recoverdDate?: string;
  diseaseName: string;
}

export interface MedicineDto {
  name: string;
  description: string;
  doseFrequency: number;
  dose: number;
  usageTimes: string[];
}

export interface DiseaseSearchResult {
  icd: string;
  name: string;
}

export interface DiagnosisCreateDto {
  patientId: number;
  icd: string;
  diagnosisDate: string;
  recoverdDate?: string;
}

export interface PhysicianFeedback {
  description: string;
  patientId: number;
  physicianId: number;
  patientName: string;
  rate: number;
}

export interface FeedbackCreateDto {
  description: string;
  rate: number;
  patientId: number;
  physicianId: number;
}

export const patientMedicalApi = {
  getDiseases: async (patientId: number): Promise<PatientDiseaseDto[]> => {
    const res = await fetch(`${BASE_URL}/patient/disease/${patientId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch patient diseases");
    return res.json();
  },

  getMedicines: async (patientId: number): Promise<MedicineDto[]> => {
    const res = await fetch(`${BASE_URL}/patient/medicine/${patientId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch patient medicines");
    return res.json();
  },

  searchDiseases: async (name: string): Promise<DiseaseSearchResult[]> => {
    const res = await fetch(`${BASE_URL}/Diseases/search?name=${encodeURIComponent(name)}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to search diseases");
    return res.json();
  },

  addDiagnosis: async (patientId: number, data: DiagnosisCreateDto): Promise<void> => {
    const res = await fetch(`${BASE_URL}/patient/disease/${patientId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to add diagnosis");
  },
};

export const physicianScheduleApi = {
  getFreeAppointments: async (physicianId: number, date: string): Promise<string[]> => {
    const res = await fetch(`${BASE_URL}/Physician/FreeAppointments/Day/${physicianId}?date=${date}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch free appointments");
    return res.json();
  },

  addFreeAppointments: async (physicianId: number, dates: string[]): Promise<void> => {
    const res = await fetch(`${BASE_URL}/Physician/FreeAppointments/${physicianId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(dates),
    });
    if (!res.ok) throw new Error("Failed to add availability");
  },

  getFeedbacks: async (physicianId: number): Promise<PhysicianFeedback[]> => {
    const res = await fetch(`${BASE_URL}/physician/feedbacks/${physicianId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      // Return empty array on error to prevent UI breaking
      console.error("Failed to fetch feedbacks, status:", res.status);
      return [];
    }
    return res.json();
  },

  addFeedback: async (physicianId: number, data: FeedbackCreateDto): Promise<void> => {
    const res = await fetch(`${BASE_URL}/physician/feedbacks/${physicianId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to add feedback");
  },
};

    if (!res.ok) throw new Error("Failed to add feedback");
  },
};

// Payment and Billing API
export interface InvoiceDto {
  Id: number;
  PatientId: number;
  PatientName: string;
  Amount: number;
  Description: string;
  InvoiceDate: string;
  DueDate?: string;
  Status: string;
  Payments: PaymentSendDto[];
}

export interface PaymentSendDto {
  Id: number;
  Amount: number;
  PaymentDate: string;
  PaymentMethod: string;
  Status: string;
}

export interface PaymentIntentDto {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

export interface PaymentConfirmationDto {
  paymentIntentId: string;
  status: string;
  amount: number;
}

export const paymentApi = {
  // Get invoices for current user
  getInvoices: async (): Promise<InvoiceDto[]> => {
    const res = await fetch(`${BASE_URL}/payments/invoices`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch invoices");
    return res.json();
  },

  // Create payment intent for an invoice
  createPaymentIntent: async (invoiceId: number): Promise<PaymentIntentDto> => {
    const res = await fetch(`${BASE_URL}/payments/create-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ invoiceId }),
    });
    if (!res.ok) throw new Error("Failed to create payment intent");
    return res.json();
  },

  // Confirm payment after successful Stripe processing
  confirmPayment: async (data: PaymentConfirmationDto): Promise<void> => {
    const res = await fetch(`${BASE_URL}/payments/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to confirm payment");
  },

  // Generate bill (admin only)
  generateBill: async (data: {
    patientId: number;
    amount: number;
    description: string;
    dueDate?: string;
  }): Promise<InvoiceDto> => {
    const res = await fetch(`${BASE_URL}/payments/generate-bill`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to generate bill");
    return res.json();
  },

  // Get payment history
  getPaymentHistory: async (): Promise<any[]> => {
    const res = await fetch(`${BASE_URL}/payments/history`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch payment history");
    return res.json();
  },
};

export const stripeApi = {
  createPaymentSession: async (data: StripePaymentDto): Promise<StripePaymentResponse> => {
    const res = await fetch(`${BASE_URL}/stripe`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create payment session");
    return res.json();
  },
};

// DICOM and Medical Imaging API
export interface DicomAnalysisResult {
  id: string;
  fileName: string;
  findings: string;
  confidence: number;
  recommendations: string;
  analyzedAt: string;
  physicianId?: number;
  patientId?: number;
}

export interface DicomUploadResponse {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

export const dicomApi = {
  // Upload DICOM file
  uploadDicom: async (file: File): Promise<DicomUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${BASE_URL}/dicom/upload`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to upload DICOM file");
    return res.json();
  },

  // Analyze DICOM file with AI/CDSS
  analyzeDicom: async (dicomId: string): Promise<DicomAnalysisResult> => {
    const res = await fetch(`${BASE_URL}/dicom/analyze/${dicomId}`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to analyze DICOM file");
    return res.json();
  },

  // Get analysis history
  getAnalyses: async (): Promise<DicomAnalysisResult[]> => {
    const res = await fetch(`${BASE_URL}/dicom/analyses`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch analyses");
    return res.json();
  },

  // Get DICOM files for patient
  getPatientDicoms: async (patientId: number): Promise<DicomUploadResponse[]> => {
    const res = await fetch(`${BASE_URL}/dicom/patient/${patientId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch patient DICOMs");
    return res.json();
  },
};

// Analytics and Reports API
export interface AnalyticsStats {
  totalPatients: number;
  appointmentsThisMonth: number;
  revenue: number;
  activePhysicians: number;
  patientChangePercent: number;
  appointmentChangePercent: number;
  revenueChangePercent: number;
  physicianChangePercent: number;
}

export interface MonthlyData {
  month: string;
  patients: number;
  appointments: number;
  revenue: number;
}

export interface SpecialtyData {
  name: string;
  value: number;
  color: string;
}

export interface PatientDemographics {
  malePatients: number;
  femalePatients: number;
  ageGroups: {
    '18-30': number;
    '31-50': number;
    '51-70': number;
    '70+': number;
  };
}

export const analyticsApi = {
  // Get dashboard statistics
  getStats: async (): Promise<AnalyticsStats> => {
    const res = await fetch(`${BASE_URL}/analytics/stats`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch analytics stats");
    return res.json();
  },

  // Get monthly trends data
  getMonthlyTrends: async (): Promise<MonthlyData[]> => {
    const res = await fetch(`${BASE_URL}/analytics/monthly-trends`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch monthly trends");
    return res.json();
  },

  // Get specialty distribution
  getSpecialtyDistribution: async (): Promise<SpecialtyData[]> => {
    const res = await fetch(`${BASE_URL}/analytics/specialties`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch specialty distribution");
    return res.json();
  },

  // Get patient demographics
  getPatientDemographics: async (): Promise<PatientDemographics> => {
    const res = await fetch(`${BASE_URL}/analytics/demographics`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch patient demographics");
=======
    if (!res.ok) throw new Error("Failed to create payment session");
>>>>>>> 8e3dd132ce188140c0c190d5235574c8f9681e7a
    return res.json();
  },
};
