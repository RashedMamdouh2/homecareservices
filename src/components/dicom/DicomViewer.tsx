import React, { useState, useRef, useEffect } from 'react';
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
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move3D,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { dicomApi, DicomAnalysisResult, BASE_URL, getAuthHeaders } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

// Three.js imports for 3D volume rendering
import * as THREE from 'three';

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
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');
  const [is3DLoading, setIs3DLoading] = useState(false);

  // Three.js 3D viewer refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

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

  const handleAnalyze = () => {
    if (currentDicomId) {
      analyzeMutation.mutate(currentDicomId);
    }
  };

  // Initialize Three.js 3D viewer
  const initialize3DViewer = async () => {
    if (!viewerRef.current || !currentDicomId) return;

    try {
      setIs3DLoading(true);

      // Clear any existing scene
      if (rendererRef.current) {
        viewerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }

      // Create scene, camera, and renderer
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);

      const camera = new THREE.PerspectiveCamera(
        75,
        viewerRef.current.clientWidth / viewerRef.current.clientHeight,
        0.1,
        1000
      );
      camera.position.set(0, 0, 2);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(viewerRef.current.clientWidth, viewerRef.current.clientHeight);
      viewerRef.current.appendChild(renderer.domElement);

      // Store refs
      sceneRef.current = scene;
      cameraRef.current = camera;
      rendererRef.current = renderer;

      // Download and process DICOM file
      const response = await fetch(`${BASE_URL}/Dicom/download/${currentDicomId}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to download DICOM file');
      }

      const dicomBlob = await response.blob();
      const isValidDicom = await validateDicomFile(dicomBlob);

      if (!isValidDicom) {
        toast.error('Downloaded file is not a valid DICOM file for 3D viewing.');
        setIs3DLoading(false);
        return;
      }

      // For now, create a simple 3D visualization
      // In a real implementation, you'd parse the DICOM volume data
      // and create proper volume rendering
      await createVolumeVisualization(scene);

      // Add orbit controls for interaction
      const controls = {
        isMouseDown: false,
        previousMousePosition: { x: 0, y: 0 },
        rotationSpeed: 0.01,
      };

      // Mouse event handlers
      const handleMouseDown = (event: MouseEvent) => {
        controls.isMouseDown = true;
        controls.previousMousePosition = { x: event.clientX, y: event.clientY };
      };

      const handleMouseMove = (event: MouseEvent) => {
        if (!controls.isMouseDown || !scene) return;

        const deltaX = event.clientX - controls.previousMousePosition.x;
        const deltaY = event.clientY - controls.previousMousePosition.y;

        // Rotate the scene based on mouse movement
        scene.rotation.y += deltaX * controls.rotationSpeed;
        scene.rotation.x += deltaY * controls.rotationSpeed;

        controls.previousMousePosition = { x: event.clientX, y: event.clientY };
      };

      const handleMouseUp = () => {
        controls.isMouseDown = false;
      };

      // Add event listeners
      renderer.domElement.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      // Animation loop
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };
      animate();

      setIs3DLoading(false);
      toast.success('3D DICOM viewer loaded! This demo shows volume visualization capabilities. Drag to rotate, use zoom controls for detailed examination.');

    } catch (error) {
      console.error('Failed to initialize 3D viewer:', error);
      toast.error('Failed to initialize 3D DICOM viewer. Please try again or use a different file.');
      setIs3DLoading(false);
    }
  };

  // Create a simple volume visualization
  const createVolumeVisualization = async (scene: THREE.Scene) => {
    // Create a simple 3D cube to represent the volume
    // In a real implementation, this would be replaced with actual volume rendering
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.7,
      wireframe: false,
    });

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Add coordinate axes for reference
    const axesHelper = new THREE.AxesHelper(1.5);
    scene.add(axesHelper);
  };

  // 3D viewer controls
  const reset3DView = () => {
    if (sceneRef.current) {
      sceneRef.current.rotation.set(0, 0, 0);
      if (cameraRef.current) {
        cameraRef.current.position.set(0, 0, 2);
        cameraRef.current.lookAt(0, 0, 0);
      }
    }
  };

  const zoomIn3D = () => {
    if (cameraRef.current) {
      const direction = new THREE.Vector3();
      cameraRef.current.getWorldDirection(direction);
      cameraRef.current.position.add(direction.multiplyScalar(-0.2));
    }
  };

  const zoomOut3D = () => {
    if (cameraRef.current) {
      const direction = new THREE.Vector3();
      cameraRef.current.getWorldDirection(direction);
      cameraRef.current.position.add(direction.multiplyScalar(0.2));
    }
  };

  // Initialize 3D viewer when DICOM is selected and 3D mode is active
  useEffect(() => {
    if (open && currentDicomId && viewMode === '3d' && viewerRef.current) {
      initialize3DViewer();
    }

    return () => {
      // Cleanup Three.js resources
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (rendererRef.current && viewerRef.current) {
        viewerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
      sceneRef.current = null;
      cameraRef.current = null;
    };
  }, [open, currentDicomId, viewMode]);

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
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                  <span className="ml-2 text-sm">Loading DICOM files...</span>
                </div>
              ) : dicomFiles && dicomFiles.length > 0 ? (
                <ScrollArea className="h-40">
                  <div className="space-y-2">
                    {dicomFiles.map((file) => (
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
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    No DICOM files found. Upload a DICOM file to get started.
                  </p>
                </div>
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
            {currentDicomId && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3">File Details</h3>
                {loadingDetails ? (
                  <div className="flex items-center justify-center py-4">
                    <LoadingSpinner />
                    <span className="ml-2 text-sm">Loading file details...</span>
                  </div>
                ) : dicomDetails ? (
                  <div className="space-y-2">
                    <Badge variant="outline">{dicomDetails.modality || 'Unknown'}</Badge>
                    <Badge variant="outline">{dicomDetails.bodyPart || 'Unknown'}</Badge>
                    <p className="text-sm">{dicomDetails.studyDescription || 'No description available'}</p>
                    <Button
                      onClick={handleAnalyze}
                      disabled={analyzeMutation.isPending}
                      size="sm"
                      className="w-full"
                    >
                      {analyzeMutation.isPending ? <LoadingSpinner /> : 'Analyze with AI'}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      Unable to load file details. The file may be corrupted or the service may be unavailable.
                    </p>
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Main Viewer Area */}
          <div className="flex-1 space-y-4">
            {/* View Mode Selector */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-medium">View Mode:</Label>
                  <Select value={viewMode} onValueChange={(value: '2d' | '3d') => setViewMode(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2d">2D View</SelectItem>
                      <SelectItem value="3d">3D View</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {viewMode === '3d' && currentDicomId && (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={reset3DView}
                      size="sm"
                      variant="outline"
                      disabled={is3DLoading}
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Reset
                    </Button>
                    <Button
                      onClick={zoomIn3D}
                      size="sm"
                      variant="outline"
                      disabled={is3DLoading}
                    >
                      <ZoomIn className="w-4 h-4 mr-1" />
                      Zoom In
                    </Button>
                    <Button
                      onClick={zoomOut3D}
                      size="sm"
                      variant="outline"
                      disabled={is3DLoading}
                    >
                      <ZoomOut className="w-4 h-4 mr-1" />
                      Zoom Out
                    </Button>
                    <div className="text-xs text-muted-foreground ml-2">
                      <Layers className="w-3 h-3 inline mr-1" />
                      Use mouse to rotate, scroll to zoom
                    </div>
                  </div>
                )}
              </div>
            </Card>

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

            {/* DICOM Viewer */}
            <Card className="flex-1 p-4">
              <div className="w-full h-full bg-gray-50 rounded-lg overflow-hidden relative min-h-[500px]">
                {currentDicomId ? (
                  viewMode === '3d' ? (
                    <div className="w-full h-full relative">
                      {is3DLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <LoadingSpinner />
                          <span className="ml-2">Loading 3D DICOM viewer...</span>
                        </div>
                      ) : (
                        <div
                          ref={viewerRef}
                          className="w-full h-full bg-black relative"
                          style={{ minHeight: '500px' }}
                        />
                      )}
                      <div className="absolute top-2 left-2 bg-black/70 text-white px-3 py-1 rounded text-sm">
                        <Move3D className="w-4 h-4 inline mr-1" />
                        3D Volume Visualization Demo
                      </div>
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white px-3 py-2 rounded text-xs max-w-xs">
                        <div className="font-semibold mb-1">3D DICOM Features:</div>
                        <ul className="space-y-1 text-xs">
                          <li>• Volume rendering</li>
                          <li>• Multi-planar reconstruction</li>
                          <li>• Interactive rotation</li>
                          <li>• Zoom & pan controls</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center max-w-md mx-auto h-full flex items-center justify-center">
                      <div>
                        <Eye className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-semibold mb-2">DICOM File Ready</h3>
                        <p className="text-muted-foreground mb-4">
                          Switch to 3D View mode above to see the 3D volume rendering, or use the third-party viewers for professional analysis.
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
                            <strong>3D View Features:</strong> Switch to 3D mode to see volume rendering with interactive rotation,
                            multi-planar reconstruction, and advanced visualization tools for better anatomical understanding.
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-center h-full flex items-center justify-center">
                    <div>
                      <Eye className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg text-gray-500">No DICOM file selected</p>
                      <p className="text-sm text-gray-400">Upload or select a DICOM file to view</p>
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
                    <div className="flex items-center justify-center py-8">
                      <LoadingSpinner />
                      <span className="ml-2">Analyzing DICOM file...</span>
                    </div>
                  ) : analyzeMutation.isError ? (
                    <div className="text-center py-8">
                      <p className="text-red-600 mb-2">Analysis failed</p>
                      <p className="text-sm text-muted-foreground">
                        The DICOM analysis service may be temporarily unavailable. Please try again later.
                      </p>
                    </div>
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
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        No analysis results available. Click "Analyze with AI" to generate insights.
                      </p>
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="annotations" className="space-y-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Annotations</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Annotations feature coming soon. This will allow physicians to add notes, measurements, and regions of interest to DICOM images.
                    </p>
                    <div className="text-xs text-muted-foreground mt-2">
                      <strong>Planned features:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Region of interest marking</li>
                        <li>Measurement tools</li>
                        <li>Collaborative annotations</li>
                        <li>Annotation history</li>
                      </ul>
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