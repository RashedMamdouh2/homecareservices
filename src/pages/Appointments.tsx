import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { appointmentsApi, physiciansApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/common/PageHeader";
import { AppointmentCard } from "@/components/appointments/AppointmentCard";
import { PageLoader } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BookAppointmentDialog } from "@/components/appointments/BookAppointmentDialog";

export default function Appointments() {
  const [search, setSearch] = useState("");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [resolvedPhysicianId, setResolvedPhysicianId] = useState<number | undefined>(undefined);
  const { user, isPatient, isPhysician, isAdmin } = useAuth();

  // If physician doesn't have ID in token, look it up by name
  const { data: allPhysicians } = useQuery({
    queryKey: ["physicians-for-lookup"],
    queryFn: physiciansApi.getAll,
    enabled: isPhysician && !user?.physicianId && !!user?.physicianName,
  });

  useEffect(() => {
    if (isPhysician && !user?.physicianId && user?.physicianName && allPhysicians) {
      const found = allPhysicians.find(p => p.name === user.physicianName);
      if (found) {
        setResolvedPhysicianId(found.id);
      }
    } else if (user?.physicianId) {
      setResolvedPhysicianId(user.physicianId);
    }
  }, [isPhysician, user?.physicianId, user?.physicianName, allPhysicians]);

  const physicianIdToUse = user?.physicianId || resolvedPhysicianId;

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments", user?.patientId, physicianIdToUse],
    queryFn: async () => {
      if (isPatient && user?.patientId) {
        return appointmentsApi.getByPatient(user.patientId);
      } else if (isPhysician && physicianIdToUse) {
        return appointmentsApi.getByPhysician(physicianIdToUse);
      } else if (isAdmin) {
        return appointmentsApi.getAll();
      }
      return [];
    },
    enabled: !isPhysician || !!physicianIdToUse,
  });

  if (isLoading) {
    return <PageLoader />;
  }

  const filteredAppointments = appointments?.filter(
    (a) =>
      a.patientName.toLowerCase().includes(search.toLowerCase()) ||
      a.physicianName.toLowerCase().includes(search.toLowerCase()) ||
      a.meetingAddress.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        description={isPhysician ? "View and manage your scheduled appointments" : "Manage and schedule homecare visits"}
        action={
          !isPhysician && (
            <Button className="gap-2" onClick={() => setBookingOpen(true)}>
              <Plus className="w-4 h-4" />
              Book Appointment
            </Button>
          )
        }
      />

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search appointments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Appointments Grid */}
      {filteredAppointments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAppointments.map((appointment, index) => (
            <div
              key={appointment.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <AppointmentCard appointment={appointment} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title={search ? "No appointments found" : "No appointments yet"}
          description={
            search
              ? "Try adjusting your search terms"
              : isPhysician 
                ? "You don't have any scheduled appointments yet."
                : "Book your first homecare appointment to get started."
          }
          action={
            !search && !isPhysician && (
              <Button className="gap-2" onClick={() => setBookingOpen(true)}>
                <Plus className="w-4 h-4" />
                Book Appointment
              </Button>
            )
          }
        />
      )}

      <BookAppointmentDialog open={bookingOpen} onOpenChange={setBookingOpen} />
    </div>
  );
}
