import { getAuthToken } from "@/contexts/AuthContext";

const BASE_URL = "https://homecareservice.runasp.net/api";
const ASSET_BASE_URL = "https://homecareservice.runasp.net";

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
