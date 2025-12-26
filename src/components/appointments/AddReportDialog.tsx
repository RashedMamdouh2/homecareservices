import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentsApi, ReportMedicationDto, getAssetUrl } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, Clock, FileDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AddReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  patientId: number;
  physicianId: number;
}

const TIME_SLOTS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"
];

interface MedicationForm {
  name: string;
  description: string;
  doseFrequency: number;
  dose: number;
  usageTimes: string[];
}

export function AddReportDialog({
  open,
  onOpenChange,
  appointmentId,
  patientId,
  physicianId,
}: AddReportDialogProps) {
  const [description, setDescription] = useState("");
  const [medications, setMedications] = useState<MedicationForm[]>([]);
  const [showTimeSelector, setShowTimeSelector] = useState<number | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      appointmentsApi.addReport(appointmentId, {
        descritpion: description,
        patientId,
        physicianId,
        medications: medications as ReportMedicationDto[],
      }),
    onSuccess: (pdfPath) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Report added successfully");
      // pdfPath is now a URL path, not base64
      setPdfUrl(pdfPath);
    },
    onError: () => {
      toast.error("Failed to add report");
    },
  });

  const resetForm = () => {
    setDescription("");
    setMedications([]);
    setShowTimeSelector(null);
    setPdfUrl(null);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const downloadPdf = () => {
    if (!pdfUrl) return;
    const fullUrl = getAssetUrl(pdfUrl);
    if (!fullUrl) return;
    const link = document.createElement("a");
    link.href = fullUrl;
    link.download = `report-${appointmentId}.pdf`;
    link.target = "_blank";
    link.click();
  };

  const addMedication = () => {
    setMedications([
      ...medications,
      { name: "", description: "", doseFrequency: 1, dose: 1, usageTimes: [] },
    ]);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index: number, field: keyof MedicationForm, value: any) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const toggleTimeSlot = (medIndex: number, time: string) => {
    const med = medications[medIndex];
    const times = med.usageTimes.includes(time)
      ? med.usageTimes.filter((t) => t !== time)
      : [...med.usageTimes, time].sort();
    updateMedication(medIndex, "usageTimes", times);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Please add a description");
      return;
    }
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {pdfUrl ? "Report Generated" : "Add Appointment Report"}
          </DialogTitle>
        </DialogHeader>

        {pdfUrl ? (
          <div className="space-y-4">
            <div className="border border-border rounded-lg overflow-hidden bg-muted/30">
              <iframe
                src={getAssetUrl(pdfUrl) || ""}
                className="w-full h-[60vh]"
                title="Report PDF"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                <X className="w-4 h-4 mr-2" /> Close
              </Button>
              <Button onClick={downloadPdf}>
                <FileDown className="w-4 h-4 mr-2" /> Download PDF
              </Button>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="description">Report Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter report description..."
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Medications</Label>
              <Button type="button" variant="outline" size="sm" onClick={addMedication}>
                <Plus className="w-4 h-4 mr-1" /> Add Medication
              </Button>
            </div>

            {medications.map((med, index) => (
              <div key={index} className="p-4 border border-border rounded-lg space-y-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Medication {index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => removeMedication(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={med.name}
                      onChange={(e) => updateMedication(index, "name", e.target.value)}
                      placeholder="Medication name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={med.description}
                      onChange={(e) => updateMedication(index, "description", e.target.value)}
                      placeholder="Description"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Dose</Label>
                    <Input
                      type="number"
                      min={1}
                      value={med.dose}
                      onChange={(e) => updateMedication(index, "dose", parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dose Frequency (per day)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={med.doseFrequency}
                      onChange={(e) => updateMedication(index, "doseFrequency", parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Usage Times</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTimeSelector(showTimeSelector === index ? null : index)}
                    >
                      <Clock className="w-4 h-4 mr-1" />
                      {showTimeSelector === index ? "Hide" : "Select Times"}
                    </Button>
                  </div>
                  
                  {med.usageTimes.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {med.usageTimes.map((time) => (
                        <Badge key={time} variant="secondary">
                          {time}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {showTimeSelector === index && (
                    <div className="grid grid-cols-6 gap-2 pt-2">
                      {TIME_SLOTS.map((time) => (
                        <Button
                          key={time}
                          type="button"
                          size="sm"
                          variant={med.usageTimes.includes(time) ? "default" : "outline"}
                          className="text-xs"
                          onClick={() => toggleTimeSlot(index, time)}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {medications.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No medications added yet
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Adding..." : "Add Report"}
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}