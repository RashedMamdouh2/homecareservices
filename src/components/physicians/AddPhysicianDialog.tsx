import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { physiciansApi, specializationsApi, PhysicianCreateDto } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export function AddPhysicianDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [clinicalAddress, setClinicalAddress] = useState("");
  const [specializationId, setSpecializationId] = useState<string>("");
  
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !clinicalAddress || !specializationId) {
      toast.error("Please fill all required fields");
      return;
    }
    mutation.mutate({
      name,
      clinicalAddress,
      specializationId: parseInt(specializationId),
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
