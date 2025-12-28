import React, { useEffect, useRef, useState } from 'react';
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
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Contrast,
  Sun,
  Move,
  Square,
  Circle,
  Ruler,
  Save,
  Download,
  Upload,
  Eye,
  EyeOff,
  Settings,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { toast } from 'sonner';
import { dicomApi, DicomAnalysisResult, BASE_URL, getAuthHeaders } from '@/lib/api';
import dicomParser from 'dicom-parser';
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentDicomId, setCurrentDicomId] = useState<string | null>(dicomId || null);
  const [activeTool, setActiveTool] = useState<string>('pan');
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [currentSlice, setCurrentSlice] = useState(0);
  const [totalSlices, setTotalSlices] = useState(1);
  const [viewMode, setViewMode] = useState<'2d' | '3d' | 'mpr'>('2d');

  // DICOM viewer state
  const [isInitialized, setIsInitialized] = useState(false);

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

  // DICOM viewer controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.1));
  const handleRotateClockwise = () => setRotation(prev => (prev + 90) % 360);
  const handleRotateCounterClockwise = () => setRotation(prev => (prev - 90 + 360) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setBrightness(0);
    setContrast(0);
  };

  const handleSliceChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentSlice(prev => Math.max(prev - 1, 0));
    } else {
      setCurrentSlice(prev => Math.min(prev + 1, totalSlices - 1));
    }
  };

  const handleAnalyze = () => {
    if (currentDicomId) {
      analyzeMutation.mutate(currentDicomId);
    }
  };

  // Initialize DICOM viewer
  useEffect(() => {
    const initializeViewer = () => {
      if (isInitialized) return;
      setIsInitialized(true);
    };

    if (open) {
      initializeViewer();
    }
  }, [open, isInitialized]);

  // Load DICOM image when file is selected
  useEffect(() => {
    const loadDicomImage = async () => {
      if (!currentDicomId || !canvasRef.current) return;

      try {
        // Download DICOM file
        const dicomBlob = await dicomApi.downloadDicom(currentDicomId);
        const dicomArrayBuffer = await dicomBlob.arrayBuffer();

        // Parse DICOM data
        const dicomDataSet = dicomParser.parseDicom(new Uint8Array(dicomArrayBuffer));

        // Extract image information
        const rows = dicomDataSet.uint16('x0028', 'x0010') || 512;
        const cols = dicomDataSet.uint16('x0028', 'x0011') || 512;
        const bitsAllocated = dicomDataSet.uint16('x0028', 'x0100') || 16;
        const bitsStored = dicomDataSet.uint16('x0028', 'x0101') || 16;
        const highBit = dicomDataSet.uint16('x0028', 'x0102') || 15;
        const pixelRepresentation = dicomDataSet.uint16('x0028', 'x0103') || 0; // 0 = unsigned, 1 = signed

        // Get pixel data
        const pixelDataElement = dicomDataSet.elements.x7fe00010;
        if (!pixelDataElement) {
          throw new Error('No pixel data found in DICOM file');
        }

        // Extract pixel data
        const pixelData = new Uint8Array(dicomArrayBuffer, pixelDataElement.dataOffset, pixelDataElement.length);

        // Handle different bit depths and signed/unsigned
        let processedPixelData: Uint16Array | Int16Array;
        if (bitsAllocated === 16) {
          if (pixelRepresentation === 1) {
            processedPixelData = new Int16Array(pixelData.buffer, pixelData.byteOffset, pixelData.length / 2);
          } else {
            processedPixelData = new Uint16Array(pixelData.buffer, pixelData.byteOffset, pixelData.length / 2);
          }
        } else {
          // 8-bit data
          processedPixelData = new Uint16Array(pixelData.length);
          for (let i = 0; i < pixelData.length; i++) {
            processedPixelData[i] = pixelData[i];
          }
        }

        // Get windowing information
        let windowCenter = dicomDataSet.floatString('x0028', 'x1050');
        let windowWidth = dicomDataSet.floatString('x0028', 'x1051');

        // Default windowing if not provided
        if (!windowCenter || !windowWidth) {
          let minVal = Infinity;
          let maxVal = -Infinity;
          for (let i = 0; i < processedPixelData.length; i++) {
            const val = processedPixelData[i];
            if (val < minVal) minVal = val;
            if (val > maxVal) maxVal = val;
          }
          windowCenter = (minVal + maxVal) / 2;
          windowWidth = maxVal - minVal;
        }

        // Create canvas for rendering
        const canvas = canvasRef.current;
        canvas.width = cols;
        canvas.height = rows;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Create ImageData
        const imageData = ctx.createImageData(cols, rows);
        const data = imageData.data;

        // Apply windowing and convert to RGBA
        const windowMin = windowCenter - windowWidth / 2;
        const windowMax = windowCenter + windowWidth / 2;

        for (let i = 0; i < processedPixelData.length; i++) {
          const pixelValue = processedPixelData[i];

          // Apply windowing
          let normalizedValue: number;
          if (pixelValue <= windowMin) {
            normalizedValue = 0;
          } else if (pixelValue >= windowMax) {
            normalizedValue = 255;
          } else {
            normalizedValue = ((pixelValue - windowMin) / (windowMax - windowMin)) * 255;
          }

          // Apply brightness and contrast adjustments
          normalizedValue = ((normalizedValue - 128) * (contrast / 100 + 1)) + 128 + brightness;
          normalizedValue = Math.max(0, Math.min(255, normalizedValue));

          const pixelIndex = i * 4;
          data[pixelIndex] = normalizedValue;     // R
          data[pixelIndex + 1] = normalizedValue; // G
          data[pixelIndex + 2] = normalizedValue; // B
          data[pixelIndex + 3] = 255;             // A
        }

        // Render the image
        ctx.putImageData(imageData, 0, 0);

        // Apply zoom and rotation using CSS transforms
        canvas.style.transform = `scale(${zoom}) rotate(${rotation}deg)`;
        canvas.style.transformOrigin = 'center center';

        // Set total slices
        setTotalSlices(1);
        setCurrentSlice(0);

        toast.success('DICOM image loaded successfully');

      } catch (error) {
        console.error('Failed to load DICOM image:', error);
        toast.error('Failed to load DICOM image. The file may be corrupted or in an unsupported format.');
      }
    };

    loadDicomImage();
  }, [currentDicomId, brightness, contrast, zoom, rotation]);

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
            {/* Viewer Controls */}
            <Card className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                {/* View Mode */}
                <Select value={viewMode} onValueChange={(value: '2d' | '3d' | 'mpr') => setViewMode(value)}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2d">2D View</SelectItem>
                    <SelectItem value="3d">3D View</SelectItem>
                    <SelectItem value="mpr">MPR</SelectItem>
                  </SelectContent>
                </Select>

                {/* Tool Selection */}
                <div className="flex items-center gap-1 border rounded-md p-1">
                  <Button
                    variant={activeTool === 'pan' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTool('pan')}
                  >
                    <Move className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={activeTool === 'zoom' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTool('zoom')}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={activeTool === 'contrast' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTool('contrast')}
                  >
                    <Contrast className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={annotationMode ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setAnnotationMode(!annotationMode)}
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                </div>

                {/* Zoom Controls */}
                <Button variant="outline" size="sm" onClick={handleZoomOut}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm min-w-[60px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button variant="outline" size="sm" onClick={handleZoomIn}>
                  <ZoomIn className="w-4 h-4" />
                </Button>

                {/* Rotation Controls */}
                <Button variant="outline" size="sm" onClick={handleRotateCounterClockwise}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleRotateClockwise}>
                  <RotateCw className="w-4 h-4" />
                </Button>

                {/* Reset */}
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Reset
                </Button>

                {/* Annotations Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnnotations(!showAnnotations)}
                >
                  {showAnnotations ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
              </div>

              {/* Slice Navigation (for multi-slice images) */}
              {totalSlices > 1 && (
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSliceChange('prev')}
                    disabled={currentSlice === 0}
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <span className="text-sm">
                    Slice {currentSlice + 1} of {totalSlices}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSliceChange('next')}
                    disabled={currentSlice === totalSlices - 1}
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Brightness/Contrast Controls */}
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Brightness:</Label>
                  <Input
                    type="range"
                    min="-100"
                    max="100"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm w-8">{brightness}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Contrast:</Label>
                  <Input
                    type="range"
                    min="-100"
                    max="100"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm w-8">{contrast}</span>
                </div>
              </div>
            </Card>

            {/* DICOM Canvas */}
            <Card className="flex-1 p-4">
              <div className="w-full h-full bg-black rounded-lg overflow-hidden relative">
                {currentDicomId ? (
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white">
                    <div className="text-center">
                      <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">No DICOM file selected</p>
                      <p className="text-sm opacity-75">Upload or select a DICOM file to view</p>
                    </div>
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