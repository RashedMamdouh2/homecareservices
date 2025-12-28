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
import { AddAvailabilityDialog } from "@/components/physicians/AddAvailabilityDialog";
import { AddFeedbackDialog } from "@/components/physicians/AddFeedbackDialog";
import { BookAppointmentDialog } from "@/components/appointments/BookAppointmentDialog";
import {
  User,
  MapPin,
  Award,
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  MessageSquare,
  Star,
  DollarSign,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function PhysicianProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isPhysician, isPatient } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [bookingOpen, setBookingOpen] = useState(false);
  const [patientsPage, setPatientsPage] = useState(1);

  // Use current user's physicianId if they're a physician viewing their own profile
  const physicianId = id ? parseInt(id) : user?.physicianId;
  const isOwnProfile = isPhysician && !id;

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

  const { data: feedbacks, isLoading: loadingFeedbacks } = useQuery({
    queryKey: ["physician-feedbacks", physicianId],
    queryFn: () => physicianScheduleApi.getFeedbacks(physicianId!),
    enabled: !!physicianId,
  });

  const { data: myPatientsData, isLoading: loadingPatients } = useQuery({
    queryKey: ["physician-patients", physicianId, patientsPage],
    queryFn: () => physiciansApi.getMyPatients(physicianId!, patientsPage),
    enabled: !!physicianId && isOwnProfile,
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {!isOwnProfile && (
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <PageHeader
            title={isOwnProfile ? "My Profile" : "Physician Profile"}
            description={isOwnProfile ? "Manage your availability and view patient feedback" : "View physician details and book appointments"}
          />
        </div>
        {isOwnProfile && <AddAvailabilityDialog physicianId={physicianId!} />}
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
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-lg font-semibold text-green-600">
                {physician.sessionPrice !== undefined && physician.sessionPrice > 0
                  ? `$${physician.sessionPrice.toFixed(2)} per session`
                  : "Free consultation"}
              </span>
            </div>
            {isPatient && (
              <div className="flex gap-2">
                <Button onClick={() => setBookingOpen(true)}>
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Book Appointment
                </Button>
                <AddFeedbackDialog physicianId={physicianId!} />
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                {isOwnProfile ? "Your schedule availability" : "Select a date to view available times"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
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
              <ScrollArea className="h-[150px]">
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
                  <div className="grid grid-cols-3 gap-2">
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

        {/* Patient Feedbacks Section */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground">
                Patient Feedback
              </h3>
              <p className="text-sm text-muted-foreground">
                {feedbacks?.length || 0} reviews from patients
              </p>
            </div>
          </div>

          <ScrollArea className="h-[350px]">
            {loadingFeedbacks ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : feedbacks?.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No feedback yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {feedbacks?.map((feedback, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-muted/50 border border-border"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium text-sm">
                        {feedback.patientName}
                      </span>
                      <div className="flex items-center gap-0.5 ml-auto">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= feedback.rate
                                ? "text-yellow-500 fill-yellow-500"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {feedback.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>

      {/* My Patients Section - Only visible to physician viewing their own profile */}
      {isOwnProfile && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground">My Patients</h3>
              <p className="text-sm text-muted-foreground">
                Patients you have appointments with
              </p>
            </div>
          </div>

          {loadingPatients ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : !myPatientsData?.patients || myPatientsData.patients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No patients yet</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {myPatientsData.patients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => navigate(`/patient-profile/${patient.id}`)}
                    className="p-4 rounded-lg bg-muted/50 border border-border hover:bg-muted hover:border-primary/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {getAssetUrl(patient.image) ? (
                          <img
                            src={getAssetUrl(patient.image)!}
                            alt={patient.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{patient.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {patient.city}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {myPatientsData.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPatientsPage((p) => Math.max(1, p - 1))}
                    disabled={patientsPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-4">
                    Page {myPatientsData.currentPage} of {myPatientsData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPatientsPage((p) => p + 1)}
                    disabled={patientsPage >= myPatientsData.totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      )}

      {/* Booking Dialog */}
      <BookAppointmentDialog open={bookingOpen} onOpenChange={setBookingOpen} />
    </div>
  );
}
