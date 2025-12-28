import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appointmentsApi, patientsApi, physiciansApi, AppointmentSendDto } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface EditAppointmentDialogProps {
  appointment: AppointmentSendDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditAppointmentDialog({
  appointment,
  open,
  onOpenChange,
}: EditAppointmentDialogProps) {
  const { user, isPatient } = useAuth();
  const [appointmentDate, setAppointmentDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [patientId, setPatientId] = useState<string>("");
  const [physicianId, setPhysicianId] = useState<string>("");
  const [meetingAddress, setMeetingAddress] = useState("");
  const [physicianNotes, setPhysicianNotes] = useState("");
  const [initialized, setInitialized] = useState(false);
  const queryClient = useQueryClient();

  const { data: patients } = useQuery({
    queryKey: ["patients"],
    queryFn: patientsApi.getAll,
    enabled: !isPatient,
  });

  const { data: physicians } = useQuery({
    queryKey: ["physicians"],
    queryFn: physiciansApi.getAll,
  });

  // Reset initialized flag when dialog closes
  useEffect(() => {
    if (!open) {
      setInitialized(false);
    }
  }, [open]);

  // Initialize form values only once when dialog opens and data is ready
  useEffect(() => {
    if (open && appointment && physicians && !initialized) {
      setAppointmentDate(appointment.appointmentDate.split("T")[0]);
      setStartTime(appointment.startTime);
      setEndTime(appointment.endTime);
      setMeetingAddress(appointment.meetingAddress);
      setPhysicianNotes(appointment.physicianNotes || "");
      
      // For patients, use their own patientId from auth
      if (isPatient && user?.patientId) {
        setPatientId(user.patientId.toString());
      } else if (patients) {
        const patient = patients.find(p => p.name === appointment.patientName);
        setPatientId(patient?.id.toString() || "");
      }
      
      // Lookup physician by name
      const physician = physicians.find(p => p.name === appointment.physicianName);
      setPhysicianId(physician?.id.toString() || "");
      
      setInitialized(true);
    }
  }, [open, appointment, patients, physicians, isPatient, user, initialized]);

  const mutation = useMutation({
    mutationFn: (data: {
      appointmentDate: string;
      startTime: string;
      endTime: string;
      patientId: number;
      physicianId: number;
      meetingAddress: string;
      physicianNotes: string;
    }) => appointmentsApi.update(appointment!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment updated successfully");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to update appointment");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentDate || !startTime || !endTime || !patientId || !physicianId) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Combine date with time to create full datetime strings
    const appointmentDateTime = `${appointmentDate}T${startTime}.000Z`;
    const startTimeFull = `${appointmentDate}T${startTime}.000Z`;
    const endTimeFull = `${appointmentDate}T${endTime}.000Z`;

    mutation.mutate({
      appointmentDate: appointmentDateTime,
      startTime: startTimeFull,
      endTime: endTimeFull,
      patientId: parseInt(patientId),
      physicianId: parseInt(physicianId),
      meetingAddress,
      physicianNotes,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Appointment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-apt-date">Date *</Label>
            <Input id="edit-apt-date" type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-apt-start">Start Time *</Label>
              <Input id="edit-apt-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-apt-end">End Time *</Label>
              <Input id="edit-apt-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
          {isPatient ? (
            <div className="space-y-2">
              <Label>Patient</Label>
              <Input value={appointment?.patientName || ""} disabled className="bg-muted" />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Patient *</Label>
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>
                  {patients?.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Physician *</Label>
            <Select value={physicianId} onValueChange={setPhysicianId}>
              <SelectTrigger><SelectValue placeholder="Select physician" /></SelectTrigger>
              <SelectContent>
                {physicians?.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>Dr. {p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-apt-address">Meeting Address</Label>
            <Input id="edit-apt-address" value={meetingAddress} onChange={(e) => setMeetingAddress(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-apt-notes">Notes</Label>
            <Textarea id="edit-apt-notes" value={physicianNotes} onChange={(e) => setPhysicianNotes(e.target.value)} rows={3} />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
