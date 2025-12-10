import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { physiciansApi, specializationsApi, PhysicianSendDto } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Upload, X } from "lucide-react";

interface EditPhysicianDialogProps {
  physician: PhysicianSendDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPhysicianDialog({
  physician,
  open,
  onOpenChange,
}: EditPhysicianDialogProps) {
  const [name, setName] = useState("");
  const [clinicalAddress, setClinicalAddress] = useState("");
  const [specializationId, setSpecializationId] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: specializations } = useQuery({
    queryKey: ["specializations"],
    queryFn: specializationsApi.getAll,
  });

  useEffect(() => {
    if (physician && specializations) {
      setName(physician.name);
      setClinicalAddress(physician.clinicalAddress);
      const spec = specializations.find(s => s.name === physician.specializationName);
      setSpecializationId(spec?.id.toString() || "");
      setImage(null);
      setImagePreview(physician.image ? `data:image/jpeg;base64,${physician.image}` : null);
    }
  }, [physician, specializations]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const mutation = useMutation({
    mutationFn: (data: { name: string; clinicalAddress: string; specializationId: number; image?: File }) =>
      physiciansApi.update(physician!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["physicians"] });
      toast.success("Physician updated successfully");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to update physician");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !specializationId) {
      toast.error("Please fill in required fields");
      return;
    }
    mutation.mutate({ 
      name, 
      clinicalAddress, 
      specializationId: parseInt(specializationId),
      ...(image && { image }) 
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Physician</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Photo</Label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-xl object-cover" />
                  <button
                    type="button"
                    onClick={() => { setImage(null); setImagePreview(null); }}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-physician-name">Name *</Label>
            <Input id="edit-physician-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Specialization *</Label>
            <Select value={specializationId} onValueChange={setSpecializationId}>
              <SelectTrigger><SelectValue placeholder="Select specialization" /></SelectTrigger>
              <SelectContent>
                {specializations?.map((spec) => (
                  <SelectItem key={spec.id} value={spec.id.toString()}>{spec.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-physician-address">Clinical Address</Label>
            <Input id="edit-physician-address" value={clinicalAddress} onChange={(e) => setClinicalAddress(e.target.value)} />
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
