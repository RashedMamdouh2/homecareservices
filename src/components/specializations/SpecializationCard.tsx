import { SpecializationDto } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, ChevronRight } from "lucide-react";

interface SpecializationCardProps {
  specialization: SpecializationDto;
  onClick: () => void;
  isSelected?: boolean;
}

export function SpecializationCard({ specialization, onClick, isSelected }: SpecializationCardProps) {
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-card hover:border-primary/30 ${
        isSelected ? "border-primary shadow-glow bg-primary/5" : ""
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isSelected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
            }`}>
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">{specialization.name}</h3>
              {specialization.description && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {specialization.description}
                </p>
              )}
            </div>
          </div>
          <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${
            isSelected ? "rotate-90 text-primary" : ""
          }`} />
        </div>
      </CardContent>
    </Card>
  );
}
