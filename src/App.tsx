import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import Physicians from "./pages/Physicians";
import Patients from "./pages/Patients";
import Specializations from "./pages/Specializations";
import PatientProfile from "./pages/PatientProfile";
import PhysicianProfile from "./pages/PhysicianProfile";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancelled from "./pages/PaymentCancelled";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Billing from "./pages/Billing";
import DicomViewer from "./pages/DicomViewer";
import Reports from "./pages/Reports";
import CDSS from "./pages/CDSS";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Protected route wrapper
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Appointments />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/physicians"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <Physicians />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <Patients />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/specializations"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Specializations />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient-profile"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <MainLayout>
              <PatientProfile />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient-profile/:id"
        element={
          <ProtectedRoute allowedRoles={['admin', 'physician']}>
            <MainLayout>
              <PatientProfile />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <ProtectedRoute allowedRoles={['patient', 'admin']}>
            <MainLayout>
              <Billing />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dicom-viewer"
        element={
          <ProtectedRoute allowedRoles={['physician', 'patient']}>
            <MainLayout>
              <DicomViewer />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <Reports />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cdss"
        element={
          <ProtectedRoute allowedRoles={['physician', 'admin']}>
            <MainLayout>
              <CDSS />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/physician-profile"
        element={
          <ProtectedRoute allowedRoles={['physician']}>
            <MainLayout>
              <PhysicianProfile />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/physician-profile/:id"
        element={
          <ProtectedRoute allowedRoles={['admin', 'patient']}>
            <MainLayout>
              <PhysicianProfile />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment-success"
        element={
          <ProtectedRoute>
            <PaymentSuccess />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment-cancelled"
        element={
          <ProtectedRoute>
            <PaymentCancelled />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <Elements stripe={stripePromise}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </Elements>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
