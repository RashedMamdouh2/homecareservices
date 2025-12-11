import { useQuery } from "@tanstack/react-query";
import { appointmentsApi, physiciansApi, patientsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/ui/stat-card";
import { AppointmentCard } from "@/components/appointments/AppointmentCard";
import { PageLoader } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { Calendar, Users, Stethoscope, Activity, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user, isPatient, isPhysician, isAdmin } = useAuth();

  const { data: appointments, isLoading: loadingAppointments } = useQuery({
    queryKey: ["appointments", user?.patientId, user?.physicianId],
    queryFn: async () => {
      if (isPatient && user?.patientId) {
        return appointmentsApi.getByPatient(user.patientId);
      } else if (isPhysician && user?.physicianId) {
        return appointmentsApi.getByPhysician(user.physicianId);
      } else if (isAdmin) {
        return appointmentsApi.getAll();
      }
      return [];
    },
  });

  const { data: physicians, isLoading: loadingPhysicians } = useQuery({
    queryKey: ["physicians"],
    queryFn: physiciansApi.getAll,
  });

  // Only admin can see all patients
  const { data: patients, isLoading: loadingPatients } = useQuery({
    queryKey: ["patients"],
    queryFn: patientsApi.getAll,
    enabled: isAdmin,
  });

  const isLoading = loadingAppointments || loadingPhysicians || (isAdmin && loadingPatients);

  if (isLoading) {
    return <PageLoader />;
  }

  const recentAppointments = appointments?.slice(0, 3) || [];
  const todayCount = appointments?.filter(a => {
    const today = new Date().toDateString();
    return new Date(a.appointmentDate).toDateString() === today;
  }).length || 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's an overview of your homecare services."
      />

      {/* Stats Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
        <StatCard
          title={isPatient ? "My Appointments" : isPhysician ? "My Appointments" : "Total Appointments"}
          value={appointments?.length || 0}
          subtitle="All time bookings"
          icon={Calendar}
          variant="primary"
        />
        <StatCard
          title="Today's Visits"
          value={todayCount}
          subtitle="Scheduled for today"
          icon={Clock}
          variant="success"
        />
        <StatCard
          title="Active Physicians"
          value={physicians?.length || 0}
          subtitle="Available doctors"
          icon={Stethoscope}
          variant="default"
        />
        {isAdmin && (
          <StatCard
            title="Total Patients"
            value={patients?.length || 0}
            subtitle="Registered patients"
            icon={Users}
            variant="warning"
          />
        )}
      </div>

      {/* Recent Appointments */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Recent Appointments</h2>
          <Link to="/appointments">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              View all
            </Button>
          </Link>
        </div>

        {recentAppointments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentAppointments.map((appointment, index) => (
              <div
                key={appointment.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <AppointmentCard appointment={appointment} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Calendar}
            title="No appointments yet"
            description={isPhysician ? "You don't have any scheduled appointments yet." : "Start by booking your first homecare appointment."}
            action={
              !isPhysician && (
                <Link to="/appointments">
                  <Button>Book Appointment</Button>
                </Link>
              )
            }
          />
        )}
      </section>

      {/* Quick Actions */}
      <section className="bg-card rounded-2xl p-6 border border-border shadow-card">
        <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className={`grid grid-cols-1 ${isPhysician ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-4`}>
          {!isPhysician && (
            <Link to="/appointments" className="block">
              <div className="p-4 rounded-xl bg-accent hover:bg-accent/80 transition-colors group">
                <Calendar className="w-6 h-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="font-medium text-accent-foreground">New Appointment</h3>
                <p className="text-sm text-muted-foreground">Schedule a home visit</p>
              </div>
            </Link>
          )}
          <Link to="/physicians" className="block">
            <div className="p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors group">
              <Stethoscope className="w-6 h-6 text-secondary-foreground mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-medium text-secondary-foreground">Find Physician</h3>
              <p className="text-sm text-muted-foreground">Browse our doctors</p>
            </div>
          </Link>
          <Link to="/patients" className="block">
            <div className="p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors group">
              <Users className="w-6 h-6 text-muted-foreground mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-medium text-foreground">Manage Patients</h3>
              <p className="text-sm text-muted-foreground">View patient records</p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
