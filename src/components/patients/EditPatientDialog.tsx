import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patientsApi, PatientSendDto, getAssetUrl } from "@/lib/api";
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

const SUBSCRIPTION_OPTIONS = [
  { value: 0, label: "Free Plan" },
  { value: 1, label: "Premium Subscription" },
  { value: 2, label: "24/7 Care" },
];

interface EditPatientDialogProps {
  patient: PatientSendDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPatientDialog({
  patient,
  open,
  onOpenChange,
}: EditPatientDialogProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [gender, setGender] = useState("");
  const [subscriptionId, setSubscriptionId] = useState<number>(0);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (patient) {
      setName(patient.name);
      setPhone(patient.phone);
      setAddress(patient.address);
      setCity(patient.city);
      setGender(patient.gender);
      setSubscriptionId(patient.subscriptionId ?? 0);
      setImage(null);
      const imageUrl = getAssetUrl(patient.image);
      setImagePreview(imageUrl);
      setOriginalImageUrl(imageUrl);
    }
  }, [patient]);

  // Helper to fetch image from URL and convert to File
  const urlToFile = async (url: string, filename: string): Promise<File | null> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new File([blob], filename, { type: blob.type || 'image/jpeg', lastModified: Date.now() });
    } catch (error) {
      console.error("Failed to fetch image:", error);
      return null;
    }
  };

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
    mutationFn: (data: { name: string; phone: string; address: string; city: string; gender: string; subscriptionId: number; image?: File }) =>
      patientsApi.update(patient!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Patient updated successfully");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to update patient");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error("Please fill in required fields");
      return;
    }
    
    // Use the new image if selected, otherwise fetch original from URL
    let imageToSend: File | undefined;
    if (image) {
      imageToSend = image;
    } else if (originalImageUrl) {
      const fetchedImage = await urlToFile(originalImageUrl, "patient-image.jpg");
      if (fetchedImage) {
        imageToSend = fetchedImage;
      }
    }
    
    if (!imageToSend) {
      toast.error("Image is required");
      return;
    }
    
    mutation.mutate({ 
      name, 
      phone, 
      address, 
      city, 
      gender, 
      subscriptionId,
      image: imageToSend
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Patient</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Photo</Label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setImage(null); setImagePreview(null); }}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-patient-name">Name *</Label>
            <Input id="edit-patient-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-patient-phone">Phone *</Label>
            <Input id="edit-patient-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-patient-address">Address</Label>
            <Input id="edit-patient-address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-patient-city">City</Label>
            <Input id="edit-patient-city" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-patient-gender">Gender</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Subscription</Label>
            <Select value={subscriptionId.toString()} onValueChange={(v) => setSubscriptionId(parseInt(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SUBSCRIPTION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
