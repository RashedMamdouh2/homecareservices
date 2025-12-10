import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { physiciansApi, specializationsApi, PhysicianCreateDto } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, X } from "lucide-react";
import { toast } from "sonner";

export function AddPhysicianDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [clinicalAddress, setClinicalAddress] = useState("");
  const [specializationId, setSpecializationId] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const queryClient = useQueryClient();

  const { data: specializations } = useQuery({
    queryKey: ["specializations"],
    queryFn: specializationsApi.getAll,
  });

  const mutation = useMutation({
    mutationFn: (data: PhysicianCreateDto) => physiciansApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["physicians"] });
      toast.success("Physician added successfully");
      setOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error("Failed to add physician");
    },
  });

  const resetForm = () => {
    setName("");
    setClinicalAddress("");
    setSpecializationId("");
    setImage(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !clinicalAddress || !specializationId || !image) {
      toast.error("Please fill all required fields including image");
      return;
    }
    mutation.mutate({
      name,
      clinicalAddress,
      specializationId: parseInt(specializationId),
      image,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Physician
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Physician</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dr. John Doe"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Clinical Address *</Label>
            <Input
              id="address"
              value={clinicalAddress}
              onChange={(e) => setClinicalAddress(e.target.value)}
              placeholder="123 Medical Center"
            />
          </div>
          <div className="space-y-2">
            <Label>Specialization *</Label>
            <Select value={specializationId} onValueChange={setSpecializationId}>
              <SelectTrigger>
                <SelectValue placeholder="Select specialization" />
              </SelectTrigger>
              <SelectContent>
                {specializations?.map((spec) => (
                  <SelectItem key={spec.id} value={spec.id.toString()}>
                    {spec.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Photo *</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            {imagePreview ? (
              <div className="relative w-24 h-24">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Photo
              </Button>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Adding..." : "Add Physician"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
