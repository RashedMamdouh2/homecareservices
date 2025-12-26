import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PhysicianSendDto, physiciansApi, getAssetUrl } from "@/lib/api";
import { MapPin, Award, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EditPhysicianDialog } from "./EditPhysicianDialog";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { toast } from "sonner";

interface PhysicianCardProps {
  physician: PhysicianSendDto;
  onClick?: () => void;
  showActions?: boolean;
}

export function PhysicianCard({ physician, onClick, showActions = true }: PhysicianCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => physiciansApi.delete(physician.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["physicians"] });
      toast.success("Physician deleted successfully");
      setDeleteOpen(false);
    },
    onError: () => {
      toast.error("Failed to delete physician");
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
            className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center flex-shrink-0 cursor-pointer"
          >
            {getAssetUrl(physician.image) ? (
              <img
                src={getAssetUrl(physician.image)!}
                alt={physician.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-primary">
                {physician.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0" onClick={onClick}>
            <h3 className="font-semibold text-card-foreground text-lg truncate group-hover:text-primary transition-colors cursor-pointer">
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
          {showActions && (
            <div className="flex flex-col gap-1">
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
          )}
        </div>
      </div>

      {showActions && (
        <>
          <EditPhysicianDialog physician={physician} open={editOpen} onOpenChange={setEditOpen} />
          <DeleteConfirmDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            title="Delete Physician"
            description={`Are you sure you want to delete Dr. ${physician.name}? This action cannot be undone.`}
            onConfirm={() => deleteMutation.mutate()}
            isLoading={deleteMutation.isPending}
          />
        </>
      )}
    </>
  );
}
