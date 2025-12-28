import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileImage, User, Stethoscope, FileText } from "lucide-react";
import { patientsApi, physiciansApi, DicomUploadRequest } from "@/lib/api";
import { toast } from "sonner";

interface DicomUploadFormProps {
  onUpload: (data: DicomUploadRequest) => void;
  isUploading: boolean;
  onFileSelect?: (file: File | null) => void;
  onMultipleFiles?: (files: File[]) => void;
}

export function DicomUploadForm({ onUpload, isUploading, onFileSelect, onMultipleFiles }: DicomUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [patientId, setPatientId] = useState<string>("");
  const [physicianId, setPhysicianId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Fetch patients and physicians
  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: patientsApi.getAll,
  });

  const { data: physicians = [] } = useQuery({
    queryKey: ['physicians'],
    queryFn: physiciansApi.getAll,
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const dicomFiles = files.filter(file =>
      file.name.toLowerCase().endsWith('.dcm') ||
      file.name.toLowerCase().endsWith('.dicom') ||
      file.type === 'application/dicom'
    );

    if (dicomFiles.length === 0) {
      toast.error("Please select valid DICOM file(s) (.dcm, .dicom)");
      return;
    }

    // If multiple files selected, use onMultipleFiles
    if (dicomFiles.length > 1 && onMultipleFiles) {
      setSelectedFiles(dicomFiles);
      setSelectedFile(dicomFiles[0]);
      onMultipleFiles(dicomFiles);
      toast.success(`${dicomFiles.length} DICOM files selected for series viewing`);
    } else {
      setSelectedFile(dicomFiles[0]);
      setSelectedFiles([dicomFiles[0]]);
      onFileSelect?.(dicomFiles[0]);
    }
  };

  const handleSubmit = () => {
    if (!selectedFile) {
      toast.error("Please select a DICOM file");
      return;
    }
    if (!patientId) {
      toast.error("Please select a patient");
      return;
    }
    if (!physicianId) {
      toast.error("Please select a physician");
      return;
    }

    onUpload({
      patientId: parseInt(patientId),
      physicianId: parseInt(physicianId),
      file: selectedFile,
      notes: notes || undefined,
    });

    // Reset form after upload
    setSelectedFile(null);
    setSelectedFiles([]);
    setNotes("");
    // Reset file input
    const fileInput = document.getElementById('dicom-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Upload DICOM Files</h3>
          <p className="text-muted-foreground text-sm">
            Select patient, physician, and DICOM file for analysis
          </p>
        </div>

        {/* Patient Selection */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Patient
          </Label>
          <Select value={patientId} onValueChange={setPatientId}>
            <SelectTrigger>
              <SelectValue placeholder="Select patient" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.id.toString()}>
                  {patient.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Physician Selection */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4" />
            Physician
          </Label>
          <Select value={physicianId} onValueChange={setPhysicianId}>
            <SelectTrigger>
              <SelectValue placeholder="Select physician" />
            </SelectTrigger>
            <SelectContent>
              {physicians.map((physician) => (
                <SelectItem key={physician.id} value={physician.id.toString()}>
                  {physician.name} - {physician.specializationName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Notes (Optional)
          </Label>
          <Textarea
            placeholder="Add any relevant notes about this DICOM file..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <FileImage className="w-4 h-4" />
            DICOM File
          </Label>
          <input
            type="file"
            accept=".dcm,.dicom,application/dicom"
            onChange={handleFileChange}
            className="hidden"
            id="dicom-upload"
            multiple
          />
          <label htmlFor="dicom-upload" className="block">
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors">
              {selectedFiles.length > 1 ? (
                <div className="flex flex-col items-center gap-1">
                  <FileImage className="w-5 h-5 text-primary" />
                  <span className="font-medium">{selectedFiles.length} DICOM files selected</span>
                  <span className="text-xs text-muted-foreground">Series mode enabled</span>
                </div>
              ) : selectedFile ? (
                <div className="flex items-center justify-center gap-2">
                  <FileImage className="w-5 h-5 text-primary" />
                  <span className="font-medium">{selectedFile.name}</span>
                </div>
              ) : (
                <div className="text-muted-foreground">
                  <Upload className="w-6 h-6 mx-auto mb-2" />
                  <p>Click to select DICOM file(s)</p>
                  <p className="text-xs mt-1">Select multiple files for slice scrolling</p>
                </div>
              )}
            </div>
          </label>
        </div>

        {/* Submit Button */}
        <Button 
          className="w-full" 
          onClick={handleSubmit}
          disabled={isUploading || !selectedFile || !patientId || !physicianId}
        >
          {isUploading ? (
            <>Uploading...</>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload DICOM
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
