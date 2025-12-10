import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SpecializationDto, specializationsApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Stethoscope, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { EditSpecializationDialog } from "./EditSpecializationDialog";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { toast } from "sonner";

interface SpecializationCardProps {
  specialization: SpecializationDto;
  onClick: () => void;
  isSelected?: boolean;
}

export function SpecializationCard({ specialization, onClick, isSelected }: SpecializationCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => specializationsApi.delete(specialization.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specializations"] });
      toast.success("Specialization deleted successfully");
      setDeleteOpen(false);
    },
    onError: () => {
      toast.error("Failed to delete specialization");
    },
  });

  return (
    <>
      <Card 
        className={`transition-all duration-200 hover:shadow-card hover:border-primary/30 ${
          isSelected ? "border-primary shadow-glow bg-primary/5" : ""
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-3 flex-1 cursor-pointer"
              onClick={onClick}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isSelected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
              }`}>
                <Stethoscope className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground">{specialization.name}</h3>
                {specialization.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {specialization.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
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
              <ChevronRight 
                className={`w-5 h-5 text-muted-foreground transition-transform cursor-pointer ${
                  isSelected ? "rotate-90 text-primary" : ""
                }`} 
                onClick={onClick}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <EditSpecializationDialog 
        specialization={specialization} 
        open={editOpen} 
        onOpenChange={setEditOpen} 
      />
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Specialization"
        description={`Are you sure you want to delete "${specialization.name}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
