import { PatientSendDto } from "@/lib/api";
import { MapPin, Phone, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface PatientCardProps {
  patient: PatientSendDto;
  onClick?: () => void;
}

export function PatientCard({ patient, onClick }: PatientCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card rounded-xl p-5 border border-border shadow-card hover:shadow-lg transition-all duration-300 cursor-pointer group",
        "hover:border-primary/30"
      )}
    >
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-accent to-primary/20 flex items-center justify-center flex-shrink-0">
          {patient.image ? (
            <img
              src={`data:image/jpeg;base64,${patient.image}`}
              alt={patient.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-7 h-7 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-card-foreground text-lg truncate group-hover:text-primary transition-colors">
            {patient.name}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-muted-foreground">
            <Phone className="w-4 h-4" />
            <span className="text-sm">{patient.phone}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border space-y-2">
        <div className="flex items-start gap-2 text-muted-foreground">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="text-sm">{patient.address}, {patient.city}</span>
        </div>
        <div className="inline-block px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium">
          {patient.gender}
        </div>
      </div>
    </div>
  );
}
