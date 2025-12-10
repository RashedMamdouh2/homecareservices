import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppointmentSendDto, appointmentsApi, MedicationDto, patientsApi, physiciansApi } from "@/lib/api";
import { Calendar, Clock, MapPin, User, Stethoscope, Pencil, Trash2, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { EditAppointmentDialog } from "./EditAppointmentDialog";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { AddReportDialog } from "./AddReportDialog";
import { ViewReportDialog } from "./ViewReportDialog";
import { toast } from "sonner";

interface AppointmentCardProps {
  appointment: AppointmentSendDto;
  onClick?: () => void;
}

export function AppointmentCard({ appointment, onClick }: AppointmentCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [viewReportOpen, setViewReportOpen] = useState(false);
  const [existingPdf, setExistingPdf] = useState<string | null>(null);
  const [existingMedications, setExistingMedications] = useState<MedicationDto[]>([]);
  const [isCheckingReport, setIsCheckingReport] = useState(false);
  const [reportPatientId, setReportPatientId] = useState<number>(0);
  const [reportPhysicianId, setReportPhysicianId] = useState<number>(0);
  const queryClient = useQueryClient();
  const formattedDate = format(parseISO(appointment.appointmentDate), "MMM d, yyyy");

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: patientsApi.getAll,
  });

  const { data: physicians = [] } = useQuery({
    queryKey: ["physicians"],
    queryFn: physiciansApi.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: () => appointmentsApi.delete(appointment.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment deleted successfully");
      setDeleteOpen(false);
    },
    onError: () => {
      toast.error("Failed to delete appointment");
    },
  });

  const handleReportClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCheckingReport(true);
    
    try {
      const appointmentDetails = await appointmentsApi.getById(appointment.id);
      
      // Look up patientId and physicianId by name since GetAppointment doesn't return IDs
      const patient = patients.find(p => p.name === appointmentDetails.patientName);
      const physician = physicians.find(p => p.name === appointmentDetails.physicianName);
      
      if (patient) setReportPatientId(patient.id);
      if (physician) setReportPhysicianId(physician.id);
      
      if (appointmentDetails.pdfBase64) {
        setExistingPdf(appointmentDetails.pdfBase64);
        setExistingMedications(appointmentDetails.medications || []);
        setViewReportOpen(true);
      } else {
        setReportOpen(true);
      }
    } catch (error) {
      toast.error("Failed to check for existing report");
    } finally {
      setIsCheckingReport(false);
    }
  };
  
  return (
    <>
      <div
        className={cn(
          "bg-card rounded-xl p-5 border border-border shadow-card hover:shadow-lg transition-all duration-300 group",
          "hover:border-primary/30"
        )}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2 text-primary">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <Clock className="w-4 h-4" />
              <span>{appointment.startTime} - {appointment.endTime}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary hover:text-primary"
              onClick={handleReportClick}
              disabled={isCheckingReport}
              title="View/Add Report"
            >
              {isCheckingReport ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => { e.stopPropagation(); setEditOpen(true); }}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); setDeleteOpen(true); }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div className="space-y-3" onClick={onClick}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <User className="w-4 h-4 text-accent-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Patient</p>
              <p className="font-medium text-card-foreground">{appointment.patientName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Physician</p>
              <p className="font-medium text-card-foreground">{appointment.physicianName}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 pt-2 border-t border-border">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
            <p className="text-sm text-muted-foreground">{appointment.meetingAddress}</p>
          </div>
        </div>

        {appointment.physicianNotes && (
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-sm text-muted-foreground line-clamp-2">{appointment.physicianNotes}</p>
          </div>
        )}
      </div>

      <EditAppointmentDialog appointment={appointment} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Appointment"
        description={`Are you sure you want to delete this appointment with ${appointment.patientName}? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
      />
      <AddReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        appointmentId={appointment.id}
        patientId={reportPatientId}
        physicianId={reportPhysicianId}
      />
      <ViewReportDialog
        open={viewReportOpen}
        onOpenChange={setViewReportOpen}
        appointmentId={appointment.id}
        pdfBase64={existingPdf || ""}
        medications={existingMedications}
      />
    </>
  );
}
