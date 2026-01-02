import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentsApi, ReportMedicationDto, getAssetUrl, patientMedicalApi, DiseaseSearchResult } from "@/lib/api";
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
import { Plus, Trash2, Clock, FileDown, X, Search, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VoiceNoteRecorder } from "./VoiceNoteRecorder";

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
  const [voiceNoteBase64, setVoiceNoteBase64] = useState<string | null>(null);
  const [voiceNoteMimeType, setVoiceNoteMimeType] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Diagnosis state
  const [diseaseSearch, setDiseaseSearch] = useState("");
  const [diseaseResults, setDiseaseResults] = useState<DiseaseSearchResult[]>([]);
  const [selectedDisease, setSelectedDisease] = useState<DiseaseSearchResult | null>(null);
  const [diagnosisDate, setDiagnosisDate] = useState(new Date().toISOString().split("T")[0]);
  const [recoveryDate, setRecoveryDate] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showDiseaseDropdown, setShowDiseaseDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Search diseases with debounce
  useEffect(() => {
    if (!diseaseSearch.trim()) {
      setDiseaseResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await patientMedicalApi.searchDiseases(diseaseSearch);
        setDiseaseResults(results);
        setShowDiseaseDropdown(true);
      } catch (error) {
        console.error("Failed to search diseases:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [diseaseSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDiseaseDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const mutation = useMutation({
    mutationFn: async () => {
      // First add the report with voice note if available
      const reportData: any = {
        descritpion: description,
        patientId,
        physicianId,
        medications: medications as ReportMedicationDto[],
      };
      
      if (voiceNoteBase64 && voiceNoteMimeType) {
        reportData.voiceNote = voiceNoteBase64;
        reportData.voiceNoteMimeType = voiceNoteMimeType;
      }
      
      const pdfPath = await appointmentsApi.addReport(appointmentId, reportData);

      // If a disease is selected, add the diagnosis
      if (selectedDisease) {
        await patientMedicalApi.addDiagnosis(patientId, {
          patientId,
          icd: selectedDisease.icd,
          diagnosisDate,
          recoverdDate: recoveryDate || undefined,
        });
      }

      return pdfPath;
    },
    onSuccess: (pdfPath) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["patient-diseases"] });
      toast.success("Report added successfully");
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
    setVoiceNoteBase64(null);
    setVoiceNoteMimeType(null);
    setDiseaseSearch("");
    setDiseaseResults([]);
    setSelectedDisease(null);
    setDiagnosisDate(new Date().toISOString().split("T")[0]);
    setRecoveryDate("");
    setShowDiseaseDropdown(false);
  };

  const handleVoiceRecordingComplete = (audioBlob: Blob, base64Audio: string) => {
    setVoiceNoteBase64(base64Audio);
    setVoiceNoteMimeType(audioBlob.type);
  };

  const handleVoiceRecordingRemove = () => {
    setVoiceNoteBase64(null);
    setVoiceNoteMimeType(null);
  };

  const selectDisease = (disease: DiseaseSearchResult) => {
    setSelectedDisease(disease);
    setDiseaseSearch(disease.name);
    setShowDiseaseDropdown(false);
  };

  const clearSelectedDisease = () => {
    setSelectedDisease(null);
    setDiseaseSearch("");
    setDiseaseResults([]);
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

          {/* Voice Note Section */}
          <div className="space-y-2">
            <Label>Voice Note (Optional)</Label>
            <VoiceNoteRecorder
              onRecordingComplete={handleVoiceRecordingComplete}
              onRecordingRemove={handleVoiceRecordingRemove}
              hasRecording={!!voiceNoteBase64}
            />
          </div>

          {/* Diagnosis Section */}
          <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
            <Label className="text-base font-semibold">Diagnosis (Optional)</Label>
            
            <div className="space-y-2" ref={searchRef}>
              <Label>Search Disease</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={diseaseSearch}
                  onChange={(e) => {
                    setDiseaseSearch(e.target.value);
                    if (selectedDisease) setSelectedDisease(null);
                  }}
                  placeholder="Type disease name to search..."
                  className="pl-9"
                  onFocus={() => diseaseResults.length > 0 && setShowDiseaseDropdown(true)}
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
                
                {showDiseaseDropdown && diseaseResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg">
                    <ScrollArea className="max-h-48">
                      {diseaseResults.map((disease) => (
                        <button
                          key={disease.icd}
                          type="button"
                          className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground flex justify-between items-center"
                          onClick={() => selectDisease(disease)}
                        >
                          <span>{disease.name}</span>
                          <span className="text-xs text-muted-foreground">{disease.icd}</span>
                        </button>
                      ))}
                    </ScrollArea>
                  </div>
                )}
              </div>
              
              {selectedDisease && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {selectedDisease.name} ({selectedDisease.icd})
                    <button type="button" onClick={clearSelectedDisease} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                </div>
              )}
            </div>

            {selectedDisease && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Diagnosis Date</Label>
                  <Input
                    type="date"
                    value={diagnosisDate}
                    onChange={(e) => setDiagnosisDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Recovery Date (Optional)</Label>
                  <Input
                    type="date"
                    value={recoveryDate}
                    onChange={(e) => setRecoveryDate(e.target.value)}
                  />
                </div>
              </div>
            )}
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