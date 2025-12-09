import { AppointmentSendDto } from "@/lib/api";
import { Calendar, Clock, MapPin, User, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

interface AppointmentCardProps {
  appointment: AppointmentSendDto;
  onClick?: () => void;
}

export function AppointmentCard({ appointment, onClick }: AppointmentCardProps) {
  const formattedDate = format(parseISO(appointment.appointmentDate), "MMM d, yyyy");
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card rounded-xl p-5 border border-border shadow-card hover:shadow-lg transition-all duration-300 cursor-pointer group",
        "hover:border-primary/30"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 text-primary">
          <Calendar className="w-4 h-4" />
          <span className="font-medium">{formattedDate}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground text-sm">
          <Clock className="w-4 h-4" />
          <span>{appointment.startTime} - {appointment.endTime}</span>
        </div>
      </div>

      <div className="space-y-3">
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
  );
}
