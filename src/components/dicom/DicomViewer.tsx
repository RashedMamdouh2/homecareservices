import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import {
  Download,
  Upload,
  Eye,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import { dicomApi, DicomAnalysisResult, BASE_URL, getAuthHeaders } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface DicomViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dicomId?: string;
  patientId?: number;
}

export function DicomViewer({
  open,
  onOpenChange,
  dicomId,
  patientId,
}: DicomViewerProps) {
  const { user, isPatient, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentDicomId, setCurrentDicomId] = useState<string | null>(dicomId || null);

  // Fetch DICOM files for patient
  const { data: dicomFiles, isLoading: loadingDicoms } = useQuery({
    queryKey: ['dicom-files', patientId],
    queryFn: () => patientId ? dicomApi.getPatientDicoms(patientId) : Promise.resolve([]),
    enabled: open && !!patientId,
  });

  // Fetch DICOM file details
  const { data: dicomDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ['dicom-details', currentDicomId],
    queryFn: () => currentDicomId ? dicomApi.getDicomDetails(currentDicomId) : Promise.resolve(null),
    enabled: !!currentDicomId,
  });

  // Upload DICOM file mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('File', file);
      formData.append('PatientId', (patientId || user?.patientId || 1).toString());
      formData.append('PhysicianId', (user?.physicianId || 1).toString());
      formData.append('Notes', 'Uploaded via DICOM viewer');

      const res = await fetch(`${BASE_URL}/Dicom/upload`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload DICOM file");
      return res.json();
    },
    onSuccess: (response) => {
      toast.success('DICOM file uploaded successfully');
      setCurrentDicomId(response.id);
      setSelectedFile(null);
      // Refetch patient DICOM files
      queryClient.invalidateQueries({ queryKey: ['dicom-files', patientId] });
    },
    onError: () => {
      toast.error('Failed to upload DICOM file');
    },
  });

  // Analyze DICOM mutation
  const analyzeMutation = useMutation({
    mutationFn: (dicomId: string) => dicomApi.analyzeDicom(dicomId),
    onSuccess: (result) => {
      toast.success('DICOM analysis completed');
      console.log('Analysis result:', result);
    },
    onError: () => {
      toast.error('Failed to analyze DICOM file');
    },
  });

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const validateDicomFile = async (blob: Blob): Promise<boolean> => {
    try {
      const arrayBuffer = await blob.slice(0, 132).arrayBuffer(); // Read first 132 bytes (DICOM header)
      const uint8Array = new Uint8Array(arrayBuffer);

      // Check for DICOM magic number (DICM at offset 128)
      const dicmSignature = String.fromCharCode(...uint8Array.slice(128, 132));
      return dicmSignature === 'DICM';
    } catch (error) {
      console.error('Error validating DICOM file:', error);
      return false;
    }
  };

  const handleUploadToIDC = async () => {
    if (!currentDicomId) return;

    try {
      toast.info('Preparing DICOM file for IDC upload...');

      // Download the DICOM file
      const response = await fetch(`${BASE_URL}/Dicom/download/${currentDicomId}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to download DICOM file');
      }

      const dicomBlob = await response.blob();

      // Validate the DICOM file
      const isValidDicom = await validateDicomFile(dicomBlob);
      if (!isValidDicom) {
        toast.error('Downloaded file is not a valid DICOM file. It may have been corrupted during upload.');
        return;
      }

      // Create FormData for IDC upload
      const formData = new FormData();
      formData.append('file', dicomBlob, `dicom_${currentDicomId}.dcm`);

      // Note: IDC doesn't have a direct upload API, so we'll download and instruct user
      const downloadUrl = URL.createObjectURL(dicomBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `dicom_${currentDicomId}.dcm`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(downloadUrl);

      toast.success('DICOM file downloaded! Upload it to the IDC viewer that opened.');

      // Open IDC viewer
      window.open('https://viewer.imaging.datacommons.cancer.gov/viewer/', '_blank');

    } catch (error) {
      console.error('Failed to prepare DICOM file for IDC:', error);
      toast.error('Failed to prepare DICOM file for IDC upload');
    }
  };

  const handleUploadToOHIF = async () => {
    if (!currentDicomId) return;

    try {
      toast.info('Preparing DICOM file for OHIF viewer...');

      // For OHIF demo, we'll download the file since they don't have direct upload API
      const response = await fetch(`${BASE_URL}/Dicom/download/${currentDicomId}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to download DICOM file');
      }

      const dicomBlob = await response.blob();

      const isValidDicom = await validateDicomFile(dicomBlob);
      if (!isValidDicom) {
        toast.error('Downloaded file is not a valid DICOM file.');
        return;
      }

      const downloadUrl = URL.createObjectURL(dicomBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `dicom_${currentDicomId}.dcm`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(downloadUrl);

      toast.success('DICOM file downloaded! Upload it to the OHIF viewer that opened.');

      // Open OHIF viewer
      window.open('https://ohif-viewer.vercel.app/', '_blank');

    } catch (error) {
      console.error('Failed to prepare DICOM file for OHIF:', error);
      toast.error('Failed to prepare DICOM file for OHIF viewer');
    }
  };

  const handleUploadToRadiopaedia = async () => {
    if (!currentDicomId) return;

    try {
      toast.info('Preparing DICOM file for Radiopaedia...');

      const response = await fetch(`${BASE_URL}/Dicom/download/${currentDicomId}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to download DICOM file');
      }

      const dicomBlob = await response.blob();

      const isValidDicom = await validateDicomFile(dicomBlob);
      if (!isValidDicom) {
        toast.error('Downloaded file is not a valid DICOM file.');
        return;
      }

      const downloadUrl = URL.createObjectURL(dicomBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `dicom_${currentDicomId}.dcm`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(downloadUrl);

      toast.success('DICOM file downloaded! Upload it to Radiopaedia.org for professional viewing.');

      // Open Radiopaedia
      window.open('https://www.radiopaedia.org/viewer', '_blank');

    } catch (error) {
      console.error('Failed to prepare DICOM file for Radiopaedia:', error);
      toast.error('Failed to prepare DICOM file for Radiopaedia');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            DICOM Medical Imaging Viewer
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 h-[70vh]">
          {/* Left Sidebar - File Management */}
          <div className="w-80 space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">DICOM Files</h3>
              {loadingDicoms ? (
                <LoadingSpinner />
              ) : (
                <ScrollArea className="h-40">
                  <div className="space-y-2">
                    {dicomFiles?.map((file) => (
                      <div
                        key={file.id}
                        className={`p-2 rounded cursor-pointer border ${
                          currentDicomId === file.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setCurrentDicomId(file.id)}
                      >
                        <div className="font-medium text-sm">{file.fileName}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(file.uploadedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </Card>

            {/* File Upload */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Upload DICOM File</h3>
              <div className="space-y-3">
                <Input
                  type="file"
                  accept=".dcm,.dicom"
                  onChange={handleFileUpload}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                />
                {selectedFile && (
                  <div className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name}
                  </div>
                )}
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploadMutation.isPending}
                  className="w-full"
                >
                  {uploadMutation.isPending ? <LoadingSpinner /> : <Upload className="w-4 h-4 mr-2" />}
                  Upload
                </Button>
              </div>
            </Card>

            {/* Analysis Results */}
            {dicomDetails && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Analysis Results</h3>
                <div className="space-y-2">
                  <Badge variant="outline">{dicomDetails.modality || 'Unknown'}</Badge>
                  <Badge variant="outline">{dicomDetails.bodyPart || 'Unknown'}</Badge>
                  <p className="text-sm">{dicomDetails.studyDescription || 'No description'}</p>
                  <Button
                    onClick={handleAnalyze}
                    disabled={analyzeMutation.isPending}
                    size="sm"
                    className="w-full"
                  >
                    {analyzeMutation.isPending ? <LoadingSpinner /> : 'Analyze with AI'}
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Main Viewer Area */}
          <div className="flex-1 space-y-4">
            {/* Third-Party Service Integration */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Professional DICOM Viewers</h3>
              <div className="text-sm text-muted-foreground mb-4">
                Upload your DICOM files directly to professional medical imaging platforms for expert analysis and diagnosis.
              </div>
              <div className="space-y-3">
                <Button
                  onClick={handleUploadToRadiopaedia}
                  disabled={!currentDicomId}
                  className="w-full"
                  variant="default"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload to Radiopaedia
                </Button>

                <div className="text-sm font-medium text-center">Medical Research Platforms:</div>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    onClick={handleUploadToIDC}
                    disabled={!currentDicomId}
                    variant="outline"
                    className="justify-start"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Upload to IDC Cancer Viewer
                  </Button>
                  <Button
                    onClick={handleUploadToOHIF}
                    disabled={!currentDicomId}
                    variant="outline"
                    className="justify-start"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Upload to OHIF Viewer
                  </Button>
                </div>

                <div className="text-sm font-medium text-center">Additional Tools:</div>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    onClick={() => window.open('https://www.weasis.org/', '_blank')}
                    variant="outline"
                    className="justify-start"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Weasis (Desktop DICOM Viewer)
                  </Button>
                  <Button
                    onClick={() => window.open('https://dicomviewer.online/', '_blank')}
                    variant="outline"
                    className="justify-start"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Online DICOM Viewer
                  </Button>
                </div>
              </div>
            </Card>

            {/* DICOM Viewer Placeholder */}
            <Card className="flex-1 p-4">
              <div className="w-full h-full bg-gray-50 rounded-lg overflow-hidden relative min-h-[500px] flex items-center justify-center">
                {currentDicomId ? (
                  <div className="text-center max-w-md">
                    <Eye className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold mb-2">DICOM File Ready</h3>
                    <p className="text-muted-foreground mb-4">
                      Use the third-party viewers above to view your DICOM file professionally.
                      The file will be validated before download.
                    </p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div><strong>File:</strong> {dicomDetails?.fileName || `dicom_${currentDicomId}.dcm`}</div>
                      {dicomDetails?.fileSize && (
                        <div><strong>Size:</strong> {(dicomDetails.fileSize / 1024 / 1024).toFixed(2)} MB</div>
                      )}
                      {dicomDetails?.modality && (
                        <div><strong>Modality:</strong> {dicomDetails.modality}</div>
                      )}
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Tip:</strong> Professional DICOM viewers provide better image quality,
                        measurements, and diagnostic tools than web viewers.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <Eye className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg text-gray-500">No DICOM file selected</p>
                    <p className="text-sm text-gray-400">Upload or select a DICOM file to view</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Sidebar - Analysis & Annotations */}
          <div className="w-80 space-y-4">
            <Tabs defaultValue="analysis" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
                <TabsTrigger value="annotations">Annotations</TabsTrigger>
              </TabsList>

              <TabsContent value="analysis" className="space-y-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">AI Analysis Results</h3>
                  {analyzeMutation.isPending ? (
                    <LoadingSpinner />
                  ) : analyzeMutation.data ? (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Findings:</Label>
                        <p className="text-sm text-muted-foreground">
                          {analyzeMutation.data.findings}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Confidence:</Label>
                        <Badge variant="outline">
                          {Math.round(analyzeMutation.data.confidence * 100)}%
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Recommendations:</Label>
                        <p className="text-sm text-muted-foreground">
                          {analyzeMutation.data.recommendations}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No analysis results available. Click "Analyze with AI" to generate insights.
                    </p>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="annotations" className="space-y-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Annotations</h3>
                  <div className="space-y-2">
                    {/* Mock annotations - in production, these would be fetched from API */}
                    <div className="p-2 border rounded">
                      <div className="font-medium text-sm">Region of Interest</div>
                      <div className="text-xs text-muted-foreground">Dr. Smith - 2 hours ago</div>
                    </div>
                    <div className="p-2 border rounded">
                      <div className="font-medium text-sm">Measurement</div>
                      <div className="text-xs text-muted-foreground">Dr. Johnson - 1 day ago</div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}