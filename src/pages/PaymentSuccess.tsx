import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentsApi, physicianScheduleApi } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { CheckCircle, Calendar, Home } from "lucide-react";
import { toast } from "sonner";

interface AppointmentData {
  physicianId: number;
  date: string;
  time: string;
  patientId: string;
  address: string;
  notes: string;
}

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [bookingComplete, setBookingComplete] = useState(false);

  const bookMutation = useMutation({
    mutationFn: appointmentsApi.create,
    onSuccess: () => {
      setBookingComplete(true);
      toast.success("Appointment booked successfully!");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (error: Error) => {
      console.error("Appointment booking failed:", error);
      toast.error(`Payment successful but failed to book appointment: ${error?.message || "Please contact support."}`);
    },
  });

  useEffect(() => {
    const dataParam = searchParams.get("data");
    if (dataParam && !bookingComplete && !bookMutation.isPending) {
      try {
        const appointmentData: AppointmentData = JSON.parse(decodeURIComponent(dataParam));
        
        // Validate availability before booking
        const validateAndBook = async () => {
          try {
            const availableSlots = await physicianScheduleApi.getFreeAppointments(
              appointmentData.physicianId,
              appointmentData.date.split('T')[0] // Extract date part only
            );

            if (!availableSlots.includes(appointmentData.time)) {
              toast.error("This appointment slot is no longer available. Your payment will be refunded.");
              navigate("/appointments");
              return;
            }

            // Calculate end time (1 hour after start time)
            const [hours, minutes, seconds] = appointmentData.time.split(":").map(Number);
            const endHours = (hours + 1).toString().padStart(2, "0");
            const endTime = `${endHours}:${minutes.toString().padStart(2, "0")}:${(seconds || 0).toString().padStart(2, "0")}`;

            // Send data in the format expected by backend
            const datePart = appointmentData.date.split('T')[0]; // Extract date part only

            bookMutation.mutate({
              appointmentDate: datePart, // Just date part
              startTime: appointmentData.time, // Just time part
              endTime: endTime, // Just time part
              patientId: parseInt(appointmentData.patientId),
              physicianId: appointmentData.physicianId,
              meetingAddress: appointmentData.address,
              physicianNotes: appointmentData.notes,
            });
          } catch (error) {
            console.error("Availability check failed:", error);
            toast.error("Failed to verify appointment availability. Please contact support for refund.");
            navigate("/appointments");
          }
        };

        validateAndBook();
      } catch (error) {
        toast.error("Invalid appointment data");
      }
    }
  }, [searchParams, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        {bookMutation.isPending ? (
          <>
            <LoadingSpinner className="mx-auto" />
            <div>
              <h2 className="text-xl font-semibold">Processing Your Booking</h2>
              <p className="text-muted-foreground mt-2">
                Please wait while we confirm your appointment...
              </p>
            </div>
          </>
        ) : bookingComplete ? (
          <>
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-green-600">Payment Successful!</h2>
              <p className="text-muted-foreground mt-2">
                Your appointment has been booked successfully.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate("/appointments")}>
                <Calendar className="w-4 h-4 mr-2" />
                View Appointments
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Payment Received</h2>
              <p className="text-muted-foreground mt-2">
                Setting up your appointment...
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
