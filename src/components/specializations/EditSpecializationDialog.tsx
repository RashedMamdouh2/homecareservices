import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { specializationsApi, SpecializationDto } from "@/lib/api";
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
import { toast } from "sonner";

interface EditSpecializationDialogProps {
  specialization: SpecializationDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSpecializationDialog({
  specialization,
  open,
  onOpenChange,
}: EditSpecializationDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (specialization) {
      setName(specialization.name);
      setDescription(specialization.description || "");
    }
  }, [specialization]);

  const mutation = useMutation({
    mutationFn: (data: { name: string; description: string }) =>
      specializationsApi.update(specialization!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specializations"] });
      toast.success("Specialization updated successfully");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to update specialization");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a specialization name");
      return;
    }
    mutation.mutate({ name, description });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Specialization</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Specialization name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
