const BASE_URL = "https://homecareservice.runasp.net/api";

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
    const res = await fetch(`${BASE_URL}/appointments/GetAllAppointments`);
    if (!res.ok) throw new Error("Failed to fetch appointments");
    return res.json();
  },
  
  getById: async (id: string): Promise<AppointmentSendDto> => {
    const res = await fetch(`${BASE_URL}/appointments/GetAppointment/${id}`);
    if (!res.ok) throw new Error("Failed to fetch appointment");
    return res.json();
  },
  
  create: async (data: AppointmentCreateDto): Promise<void> => {
    const res = await fetch(`${BASE_URL}/appointments/BookAppointment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to book appointment");
  },

  update: async (id: string, data: AppointmentCreateDto): Promise<void> => {
    const res = await fetch(`${BASE_URL}/appointments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update appointment");
  },

  delete: async (id: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/appointments/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete appointment");
  },

  addReport: async (appointmentId: string, data: ReportCreateDto): Promise<string> => {
    const res = await fetch(`${BASE_URL}/Appointments/Add/Appointment/Report/${appointmentId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to add report");
    const result = await res.json();
    return result.pdfBase64;
  },
};

export const physiciansApi = {
  getAll: async (): Promise<PhysicianSendDto[]> => {
    const res = await fetch(`${BASE_URL}/physician/GetAllPhysicians`);
    if (!res.ok) throw new Error("Failed to fetch physicians");
    return res.json();
  },
  
  getById: async (id: number): Promise<PhysicianSendDto> => {
    const res = await fetch(`${BASE_URL}/physician/GetPhysician/${id}`);
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
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to update physician");
  },

  delete: async (id: number): Promise<void> => {
    const res = await fetch(`${BASE_URL}/physician/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete physician");
  },
};

export const patientsApi = {
  getAll: async (): Promise<PatientSendDto[]> => {
    const res = await fetch(`${BASE_URL}/patient/GetAllPatients`);
    if (!res.ok) throw new Error("Failed to fetch patients");
    return res.json();
  },
  
  getById: async (id: number): Promise<PatientSendDto> => {
    const res = await fetch(`${BASE_URL}/patient/GetPatient/${id}`);
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
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to update patient");
  },

  delete: async (id: number): Promise<void> => {
    const res = await fetch(`${BASE_URL}/patient/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete patient");
  },
};

export const specializationsApi = {
  getAll: async (): Promise<SpecializationDto[]> => {
    const res = await fetch(`${BASE_URL}/specialization/GetAllSpecializations`);
    if (!res.ok) throw new Error("Failed to fetch specializations");
    return res.json();
  },

  getPhysicians: async (specializationId: number): Promise<PhysicianSendDto[]> => {
    const res = await fetch(`${BASE_URL}/specialization/GetPhysicians/${specializationId}`);
    if (!res.ok) throw new Error("Failed to fetch physicians for specialization");
    return res.json();
  },

  create: async (data: SpecializationCreateDto): Promise<void> => {
    const res = await fetch(`${BASE_URL}/specialization/AddSpecialization`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to add specialization");
  },

  update: async (id: number, data: Partial<SpecializationCreateDto>): Promise<void> => {
    const res = await fetch(`${BASE_URL}/specialization/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    if (!res.ok) throw new Error("Failed to update specialization");
  },

  delete: async (id: number): Promise<void> => {
    const res = await fetch(`${BASE_URL}/specialization/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete specialization");
  },
};

export interface AvailableHoursDto {
  availableSlots: string[];
}
