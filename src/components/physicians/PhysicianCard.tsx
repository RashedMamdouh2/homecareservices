import { PhysicianSendDto } from "@/lib/api";
import { MapPin, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhysicianCardProps {
  physician: PhysicianSendDto;
  onClick?: () => void;
}

export function PhysicianCard({ physician, onClick }: PhysicianCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card rounded-xl p-5 border border-border shadow-card hover:shadow-lg transition-all duration-300 cursor-pointer group",
        "hover:border-primary/30"
      )}
    >
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center flex-shrink-0">
          {physician.image ? (
            <img
              src={`data:image/jpeg;base64,${physician.image}`}
              alt={physician.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-primary">
              {physician.name.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-card-foreground text-lg truncate group-hover:text-primary transition-colors">
            Dr. {physician.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Award className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">
              {physician.specializationName}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="text-sm truncate">{physician.clinicalAddress}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
