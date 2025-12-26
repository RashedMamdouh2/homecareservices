import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PatientSendDto, patientsApi, getAssetUrl } from "@/lib/api";
import { MapPin, Phone, User, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EditPatientDialog } from "./EditPatientDialog";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { toast } from "sonner";

interface PatientCardProps {
  patient: PatientSendDto;
  onClick?: () => void;
}

export function PatientCard({ patient, onClick }: PatientCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => patientsApi.delete(patient.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Patient deleted successfully");
      setDeleteOpen(false);
    },
    onError: () => {
      toast.error("Failed to delete patient");
    },
  });

  return (
    <>
      <div
        className={cn(
          "bg-card rounded-xl p-5 border border-border shadow-card hover:shadow-lg transition-all duration-300 group",
          "hover:border-primary/30"
        )}
      >
        <div className="flex items-center gap-4">
          <div 
            onClick={onClick}
            className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-accent to-primary/20 flex items-center justify-center flex-shrink-0 cursor-pointer"
          >
            {getAssetUrl(patient.image) ? (
              <img
                src={getAssetUrl(patient.image)!}
                alt={patient.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-7 h-7 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0" onClick={onClick}>
            <h3 className="font-semibold text-card-foreground text-lg truncate group-hover:text-primary transition-colors cursor-pointer">
              {patient.name}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span className="text-sm">{patient.phone}</span>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); setEditOpen(true); }}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); setDeleteOpen(true); }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
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

      <EditPatientDialog patient={patient} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Patient"
        description={`Are you sure you want to delete ${patient.name}? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
