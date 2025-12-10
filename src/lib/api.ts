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
  patientName: string;
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
  image?: string;
}

export interface PatientSendDto {
  id: number;
  name: string;
  phone: string;
  address: string;
  city: string;
  gender: string;
  image?: string;
}

export interface PatientCreateDto {
  name: string;
  phone: string;
  address: string;
  city: string;
  gender: string;
  image?: string;
}

export interface SpecializationDto {
  id: number;
  name: string;
}

// API Functions
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
    const res = await fetch(`${BASE_URL}/physician/AddPhysician`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to add physician");
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
    const res = await fetch(`${BASE_URL}/patient/AddPatient`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to add patient");
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
};

export interface AvailableHoursDto {
  availableSlots: string[];
}
