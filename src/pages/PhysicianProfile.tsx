import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { physiciansApi, physicianScheduleApi, getAssetUrl } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User,
  MapPin,
  Award,
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
} from "lucide-react";

export default function PhysicianProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isPhysician } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Use current user's physicianId if they're a physician viewing their own profile
  const physicianId = id ? parseInt(id) : user?.physicianId;

  const { data: physician, isLoading: loadingPhysician } = useQuery({
    queryKey: ["physician", physicianId],
    queryFn: () => physiciansApi.getById(physicianId!),
    enabled: !!physicianId,
  });

  const { data: freeSlots, isLoading: loadingSlots } = useQuery({
    queryKey: ["physician-free-slots", physicianId, selectedDate?.toISOString()],
    queryFn: () =>
      physicianScheduleApi.getFreeAppointments(
        physicianId!,
        format(selectedDate!, "yyyy-MM-dd")
      ),
    enabled: !!physicianId && !!selectedDate,
  });

  if (loadingPhysician) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!physician) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Physician not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {!isPhysician && (
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <PageHeader
          title="Physician Profile"
          description="View physician details and available appointments"
        />
      </div>

      {/* Physician Info Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center flex-shrink-0">
            {getAssetUrl(physician.image) ? (
              <img
                src={getAssetUrl(physician.image)!}
                alt={physician.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl font-bold text-primary">
                {physician.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-semibold text-card-foreground">
                Dr. {physician.name}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <Award className="w-5 h-5 text-primary" />
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                  {physician.specializationName}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <MapPin className="w-5 h-5 text-primary" />
              <span>{physician.clinicalAddress}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Available Appointments Section */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-card-foreground">
              Available Appointments
            </h3>
            <p className="text-sm text-muted-foreground">
              {isPhysician ? "Your schedule availability" : "Select a date to view available times"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              className="rounded-md border"
            />
          </div>

          {/* Time Slots */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {selectedDate
                  ? `Available times for ${format(selectedDate, "MMM d, yyyy")}`
                  : "Select a date"}
              </span>
            </div>
            <ScrollArea className="h-[250px]">
              {loadingSlots ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : !selectedDate ? (
                <p className="text-muted-foreground text-center py-8">
                  Please select a date
                </p>
              ) : freeSlots?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No available slots for this date
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {freeSlots?.map((time, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center"
                    >
                      <span className="text-sm font-medium text-primary">
                        {formatTime(time)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </Card>
    </div>
  );
}
