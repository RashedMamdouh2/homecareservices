import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'physician' | 'admin';
  token: string;
  patientId?: number;
  physicianId?: number;
  physicianName?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  signupPatient: (data: PatientSignupData) => Promise<{ success: boolean; error?: string }>;
  signupPhysician: (data: PhysicianSignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: boolean;
  isPatient: boolean;
  isPhysician: boolean;
}

export interface PatientSignupData {
  name: string;
  phone: string;
  gender: string;
  address: string;
  city: string;
  email: string;
  password: string;
  userName: string;
  subscriptionId: number;
  image: File | null;
}

export interface PhysicianSignupData {
  name: string;
  specializationId: number;
  clinicalAddress: string;
  email: string;
  password: string;
  phone: string;
  userName: string;
  image: File | null;
  sessionPrice: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = 'https://homecareservice.runasp.net/api';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth on mount
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string, rememberMe = false): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE}/Account/Login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, rememberMe }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: errorText || 'Login failed' };
      }

      // Response is a direct JWT token string
      const token = await response.text();
      
      // Parse JWT to get user info
      const tokenPayload = parseJwt(token);
      
      // .NET uses full URI claim types
      const role = tokenPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 'patient';
      const userData: User = {
        id: tokenPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || '',
        name: tokenPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || username,
        email: '',
        role: role,
        token: token,
        patientId: role === 'patient' && tokenPayload['PatientId'] ? Number(tokenPayload['PatientId']) : undefined,
        physicianId: role === 'physician' && tokenPayload['PhysicianId'] ? Number(tokenPayload['PhysicianId']) : undefined,
        physicianName: role === 'physician' ? tokenPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] : undefined,
      };

      setUser(userData);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const signupPatient = async (data: PatientSignupData): Promise<{ success: boolean; error?: string }> => {
    try {
      const formData = new FormData();
      formData.append('Name', data.name);
      formData.append('Phone', data.phone);
      formData.append('Gender', data.gender);
      formData.append('Address', data.address);
      formData.append('City', data.city);
      formData.append('Email', data.email);
      formData.append('Password', data.password);
      formData.append('UserName', data.userName);
      formData.append('SubscriptionId', data.subscriptionId.toString());
      if (data.image) {
        formData.append('Image', data.image);
      }

      const response = await fetch(`${API_BASE}/Account/Signup/Patient`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: errorText || 'Signup failed' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const signupPhysician = async (data: PhysicianSignupData): Promise<{ success: boolean; error?: string }> => {
    try {
      const formData = new FormData();
      formData.append('Name', data.name);
      formData.append('SpecializationId', data.specializationId.toString());
      formData.append('ClinicalAddress', data.clinicalAddress);
      formData.append('Email', data.email);
      formData.append('Password', data.password);
      formData.append('Phone', data.phone);
      formData.append('UserName', data.userName);
      formData.append('SessionPrice', data.sessionPrice.toString());
      if (data.image) {
        formData.append('Image', data.image);
      }

      const response = await fetch(`${API_BASE}/Account/Signup/Physician`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: errorText || 'Signup failed' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return {};
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signupPatient,
        signupPhysician,
        logout,
        isAdmin: user?.role === 'admin',
        isPatient: user?.role === 'patient',
        isPhysician: user?.role === 'physician',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const getAuthToken = (): string | null => {
  const storedUser = localStorage.getItem('auth_user');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      return user.token;
    } catch {
      return null;
    }
  }
  return null;
};
