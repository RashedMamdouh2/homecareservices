import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, getDaysInMonth, startOfMonth, getDay } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  specializationsApi,
  appointmentsApi,
  patientsApi,
  physicianScheduleApi,
  physiciansApi,
  stripeApi,
  getAssetUrl,
  PhysicianSendDto,
  SpecializationDto,
} from "@/lib/api";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  ArrowLeft,
  Stethoscope,
  User,
  Calendar,
  Clock,
  MapPin,
  FileText,
  ChevronLeft,
  ChevronRight,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";

type BookingStep = "specialization" | "physician" | "datetime" | "details" | "payment";

interface BookAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookAppointmentDialog({
  open,
  onOpenChange,
}: BookAppointmentDialogProps) {
  const queryClient = useQueryClient();
  const { user, isPatient, isAdmin } = useAuth();
  const [step, setStep] = useState<BookingStep>("specialization");
  const [selectedSpecialization, setSelectedSpecialization] =
    useState<SpecializationDto | null>(null);
  const [selectedPhysician, setSelectedPhysician] =
    useState<PhysicianSendDto | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [meetingAddress, setMeetingAddress] = useState("");
  const [physicianNotes, setPhysicianNotes] = useState("");

  // Auto-select patient if logged in as patient
  useEffect(() => {
    if (open && isPatient && user?.patientId) {
      setSelectedPatientId(user.patientId.toString());
    }
  }, [open, isPatient, user?.patientId]);

  // Fetch specializations
  const { data: specializations, isLoading: loadingSpecs } = useQuery({
    queryKey: ["specializations"],
    queryFn: specializationsApi.getAll,
    enabled: open,
  });

  // Fetch physicians by specialization
  const { data: physicians, isLoading: loadingPhysicians } = useQuery({
    queryKey: ["physicians-by-spec", selectedSpecialization?.id],
    queryFn: () => specializationsApi.getPhysicians(selectedSpecialization!.id),
    enabled: !!selectedSpecialization,
  });

  // Fetch full physician details (including sessionPrice)
  const { data: physicianDetails } = useQuery({
    queryKey: ["physician-details", selectedPhysician?.id],
    queryFn: () => physiciansApi.getById(selectedPhysician!.id),
    enabled: !!selectedPhysician,
  });

  // Fetch patients for selection (only for admin)
  const { data: patients } = useQuery({
    queryKey: ["patients"],
    queryFn: patientsApi.getAll,
    enabled: step === "details" && isAdmin,
  });

  // Fetch available time slots from physician schedule
  const selectedDateFormatted = selectedDay
    ? format(new Date(selectedYear, selectedMonth, selectedDay), "yyyy-MM-dd")
    : null;

  const { data: availableSlots, isLoading: loadingAvailableSlots } = useQuery({
    queryKey: ["available-slots", selectedPhysician?.id, selectedDateFormatted],
    queryFn: () =>
      physicianScheduleApi.getFreeAppointments(
        selectedPhysician!.id,
        selectedDateFormatted!
      ),
    enabled: !!selectedPhysician && !!selectedDateFormatted,
    staleTime: 0,
    gcTime: 0,
  });

  // Book appointment mutation
  const bookMutation = useMutation({
    mutationFn: appointmentsApi.create,
    onSuccess: () => {
      toast.success("Appointment booked successfully!");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      handleClose();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to book appointment. Please try again.");
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after closing
    setTimeout(() => {
      setStep("specialization");
      setSelectedSpecialization(null);
      setSelectedPhysician(null);
      setSelectedDay(null);
      setSelectedTime(null);
      setSelectedPatientId("");
      setMeetingAddress("");
      setPhysicianNotes("");
    }, 200);
  };

  const handleBack = () => {
    switch (step) {
      case "physician":
        setStep("specialization");
        setSelectedSpecialization(null);
        break;
      case "datetime":
        setStep("physician");
        setSelectedPhysician(null);
        setSelectedDay(null);
        setSelectedTime(null);
        break;
      case "details":
        setStep("datetime");
        break;
      case "payment":
        setStep("details");
        break;
    }
  };

  const handleSpecializationSelect = (spec: SpecializationDto) => {
    setSelectedSpecialization(spec);
    setStep("physician");
  };

  const handlePhysicianSelect = (physician: PhysicianSendDto) => {
    setSelectedPhysician(physician);
    setStep("datetime");
  };

  const handleDateTimeConfirm = () => {
    if (selectedDay && selectedTime) {
      setStep("details");
    }
  };

  const handleProceedToPayment = async () => {
    if (!selectedPatientId || !meetingAddress || !physicianNotes.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Re-check availability before proceeding
    if (selectedPhysician && selectedDay && selectedTime) {
      try {
        const currentAvailableSlots = await physicianScheduleApi.getFreeAppointments(
          selectedPhysician.id,
          format(new Date(selectedYear, selectedMonth, selectedDay), "yyyy-MM-dd")
        );

        if (!currentAvailableSlots.includes(selectedTime)) {
          toast.error("This time slot is no longer available. Please select a different time.");
          // Reset to datetime step to allow reselection
          setStep("datetime");
          return;
        }
      } catch (error) {
        toast.error("Failed to verify availability. Please try again.");
        return;
      }
    }

    const sessionPrice = physicianDetails?.sessionPrice || 0;

    // If session is free, book directly
    if (sessionPrice <= 0) {
      handleBookAppointment();
      return;
    }

    // Otherwise, proceed to payment
    setStep("payment");
  };

  const handlePayment = async () => {
    if (!user?.id || !physicianDetails || !selectedPhysician || !selectedDay || !selectedTime) {
      toast.error("Missing required information");
      return;
    }

    const sessionPrice = physicianDetails.sessionPrice || 0;
    const baseUrl = window.location.origin;
    
    // Build appointment data to pass via URL params for success callback
    // Parse the selected time to include in the date
    const [hours, minutes, seconds] = selectedTime.split(":").map(Number);
    const appointmentDateTime = new Date(selectedYear, selectedMonth, selectedDay, hours, minutes, seconds || 0);
    
    // Format as local date string to preserve the correct date
    const year = appointmentDateTime.getFullYear();
    const month = String(appointmentDateTime.getMonth() + 1).padStart(2, "0");
    const day = String(appointmentDateTime.getDate()).padStart(2, "0");
    const hour = String(appointmentDateTime.getHours()).padStart(2, "0");
    const min = String(appointmentDateTime.getMinutes()).padStart(2, "0");
    const sec = String(appointmentDateTime.getSeconds()).padStart(2, "0");
    
    const appointmentData = {
      physicianId: selectedPhysician.id,
      date: `${year}-${month}-${day}T${hour}:${min}:${sec}`,
      time: selectedTime,
      patientId: selectedPatientId,
      address: meetingAddress,
      notes: physicianNotes,
    };
    
    const encodedData = encodeURIComponent(JSON.stringify(appointmentData));
    
    try {
      const response = await stripeApi.createPaymentSession({
        patientUserId: user.id,
        customerEmail: user.email || "",
        sessionPrice: sessionPrice,
        successUrl: `${baseUrl}/payment-success?data=${encodedData}`,
        cancelUrl: `${baseUrl}/payment-cancelled`,
      });
      
      // Redirect to Stripe checkout
      if (response.redirectUrl) {
        window.location.href = response.redirectUrl;
      } else {
        toast.error("Failed to create payment session");
      }
    } catch (error) {
      toast.error("Failed to process payment. Please try again.");
    }
  };

  const handleBookAppointment = () => {
    if (
      !selectedPhysician ||
      !selectedDay ||
      !selectedTime ||
      !selectedPatientId
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Parse start time
    const [hours, minutes, seconds] = selectedTime.split(":").map(Number);
    
    // Create appointment date with the start time included (local time)
    const appointmentDateTime = new Date(
      selectedYear,
      selectedMonth,
      selectedDay,
      hours,
      minutes,
      seconds || 0
    );
    
    // Format as ISO string but preserve local date by manually constructing
    const year = appointmentDateTime.getFullYear();
    const month = String(appointmentDateTime.getMonth() + 1).padStart(2, "0");
    const day = String(appointmentDateTime.getDate()).padStart(2, "0");
    const hour = String(appointmentDateTime.getHours()).padStart(2, "0");
    const min = String(appointmentDateTime.getMinutes()).padStart(2, "0");
    const sec = String(appointmentDateTime.getSeconds()).padStart(2, "0");
    
    // Create ISO-like string that preserves local date/time
    const appointmentDate = `${year}-${month}-${day}T${hour}:${min}:${sec}`;
    
    // Calculate end time (1 hour after start time)
    const endHours = (hours + 1).toString().padStart(2, "0");
    const endTime = `${endHours}:${minutes.toString().padStart(2, "0")}:${(seconds || 0).toString().padStart(2, "0")}`;

    bookMutation.mutate({
      appointmentDate,
      startTime: selectedTime,
      endTime,
      patientId: parseInt(selectedPatientId),
      PhysicianId: selectedPhysician.id,
      meetingAddress,
      physicianNotes,
    });
  };

  // Calendar helpers
  const daysInMonth = getDaysInMonth(new Date(selectedYear, selectedMonth));
  const firstDayOfMonth = getDay(startOfMonth(new Date(selectedYear, selectedMonth)));
  const monthName = format(new Date(selectedYear, selectedMonth), "MMMM");
  const years = [2024, 2025, 2026];
  const months = Array.from({ length: 12 }, (_, i) =>
    format(new Date(2024, i), "MMMM")
  );

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
    setSelectedDay(null);
  };

  const sessionPrice = physicianDetails?.sessionPrice || 0;
  const requiresPayment = sessionPrice > 0;

  const renderStepIndicator = () => {
    const baseSteps = [
      { key: "specialization", label: "Specialty", icon: Stethoscope },
      { key: "physician", label: "Doctor", icon: User },
      { key: "datetime", label: "Date & Time", icon: Calendar },
      { key: "details", label: "Details", icon: FileText },
    ];
    
    const steps = requiresPayment 
      ? [...baseSteps, { key: "payment", label: "Payment", icon: CreditCard }]
      : baseSteps;

    const currentIndex = steps.findIndex((s) => s.key === step);

    return (
      <div className="flex items-center justify-center gap-2 mb-6">
        {steps.map((s, index) => {
          const Icon = s.icon;
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          return (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-8 h-0.5 ${
                    isCompleted ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderSpecializationStep = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        Select a medical specialty to find available doctors
      </p>
      {loadingSpecs ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {specializations?.map((spec) => (
            <Card
              key={spec.id}
              className="p-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
              onClick={() => handleSpecializationSelect(spec)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium text-sm">{spec.name}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderPhysicianStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="secondary">{selectedSpecialization?.name}</Badge>
        <span>→ Select a Doctor</span>
      </div>
      {loadingPhysicians ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : physicians?.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No doctors available for this specialty
        </div>
      ) : (
        <ScrollArea className="h-[300px]">
          <div className="space-y-3 pr-4">
            {physicians?.map((physician) => (
              <Card
                key={physician.id}
                className="p-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                onClick={() => handlePhysicianSelect(physician)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {physician.image ? (
                      <img
                        src={getAssetUrl(physician.image) || undefined}
                        alt={physician.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{physician.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {physician.clinicalAddress}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );

  const renderDateTimeStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="secondary">{selectedPhysician?.name}</Badge>
        <span>→ Select Date & Time</span>
      </div>

      {/* Year/Month Selection */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Select
            value={selectedMonth.toString()}
            onValueChange={(v) => {
              setSelectedMonth(parseInt(v));
              setSelectedDay(null);
            }}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, idx) => (
                <SelectItem key={idx} value={idx.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedYear.toString()}
            onValueChange={(v) => {
              setSelectedYear(parseInt(v));
              setSelectedDay(null);
            }}
          >
            <SelectTrigger className="w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="ghost" size="icon" onClick={handleNextMonth}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-lg p-3">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-1"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const isSelected = selectedDay === day;
            const isPast =
              new Date(selectedYear, selectedMonth, day) <
              new Date(new Date().setHours(0, 0, 0, 0));
            return (
              <Button
                key={day}
                variant={isSelected ? "default" : "ghost"}
                size="sm"
                className={`h-8 w-8 p-0 ${isPast ? "opacity-50" : ""}`}
                disabled={isPast}
                onClick={() => setSelectedDay(day)}
              >
                {day}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Time Slots */}
      {selectedDay && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Available Time Slots
          </Label>
          {loadingAvailableSlots ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          ) : availableSlots?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No available slots for this date
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {availableSlots?.map((time) => {
                const isSelected = selectedTime === time;
                const displayTime = format(
                  new Date(`2024-01-01T${time}`),
                  "h:mm a"
                );
                return (
                  <Button
                    key={time}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTime(time)}
                  >
                    {displayTime}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <Button
        className="w-full"
        disabled={!selectedDay || !selectedTime || availableSlots?.length === 0}
        onClick={handleDateTimeConfirm}
      >
        Continue
      </Button>
    </div>
  );

  const renderDetailsStep = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="secondary">{selectedPhysician?.name}</Badge>
        <Badge variant="outline">
          {format(
            new Date(selectedYear, selectedMonth, selectedDay!),
            "MMM d, yyyy"
          )}
        </Badge>
        <Badge variant="outline">
          {format(new Date(`2024-01-01T${selectedTime}`), "h:mm a")}
        </Badge>
      </div>

      <div className="space-y-3">
        {/* Only show patient selection for admin */}
        {isAdmin && (
          <div className="space-y-2">
            <Label htmlFor="patient">Patient *</Label>
            <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a patient" />
              </SelectTrigger>
              <SelectContent>
                {patients?.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id.toString()}>
                    {patient.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Show patient name for patients (read-only) */}
        {isPatient && (
          <div className="space-y-2">
            <Label>Patient</Label>
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{user?.name}</span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="address" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Meeting Address *
          </Label>
          <Input
            id="address"
            placeholder="Enter meeting address"
            value={meetingAddress}
            onChange={(e) => setMeetingAddress(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Physician Notes *
          </Label>
          <Textarea
            id="notes"
            placeholder="Add any notes for the appointment..."
            value={physicianNotes}
            onChange={(e) => setPhysicianNotes(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      <Button
        className="w-full"
        disabled={!selectedPatientId || !meetingAddress || !physicianNotes.trim() || bookMutation.isPending}
        onClick={handleProceedToPayment}
      >
        {bookMutation.isPending ? (
          <>
            <LoadingSpinner className="mr-2" />
            Booking...
          </>
        ) : requiresPayment ? (
          `Proceed to Payment ($${sessionPrice.toFixed(2)})`
        ) : (
          "Book Appointment"
        )}
      </Button>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="secondary">{selectedPhysician?.name}</Badge>
        <Badge variant="outline">
          {format(
            new Date(selectedYear, selectedMonth, selectedDay!),
            "MMM d, yyyy"
          )}
        </Badge>
        <Badge variant="outline">
          {format(new Date(`2024-01-01T${selectedTime}`), "h:mm a")}
        </Badge>
      </div>

      <Card className="p-6 bg-muted/50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <CreditCard className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Complete Your Payment</h3>
            <p className="text-muted-foreground text-sm mt-1">
              You will be redirected to Stripe to complete the payment
            </p>
          </div>
          <div className="py-4 border-t border-b border-border">
            <p className="text-sm text-muted-foreground">Session Price</p>
            <p className="text-3xl font-bold text-primary">
              ${sessionPrice.toFixed(2)}
            </p>
          </div>
        </div>
      </Card>

      <Button
        className="w-full"
        onClick={handlePayment}
      >
        <CreditCard className="w-4 h-4 mr-2" />
        Pay Now
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {step !== "specialization" && (
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <DialogTitle>Book Appointment</DialogTitle>
          </div>
        </DialogHeader>

        {renderStepIndicator()}

        {step === "specialization" && renderSpecializationStep()}
        {step === "physician" && renderPhysicianStep()}
        {step === "datetime" && renderDateTimeStep()}
        {step === "details" && renderDetailsStep()}
        {step === "payment" && renderPaymentStep()}
      </DialogContent>
    </Dialog>
  );
}