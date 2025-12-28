import { useEffect, useRef, useState, useCallback } from "react";
import dicomParser from "dicom-parser";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, RefreshCw, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

interface DicomImageViewerProps {
  file: File | null;
}

interface DicomSlice {
  pixelData: Int16Array | Uint16Array | Uint8Array;
  instanceNumber: number;
  sliceLocation: number;
}

interface DicomImageData {
  width: number;
  height: number;
  windowCenter: number;
  windowWidth: number;
  slices: DicomSlice[];
  slope: number;
  intercept: number;
  patientName: string;
  studyDescription: string;
  modality: string;
  bitsAllocated: number;
  bitsStored: number;
  highBit: number;
  photometricInterpretation: string;
}

export function DicomImageViewer({ file }: DicomImageViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageData, setImageData] = useState<DicomImageData | null>(null);
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSlice, setCurrentSlice] = useState(0);

  const loadDicomFile = useCallback(async (dicomFile: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const arrayBuffer = await dicomFile.arrayBuffer();
      const byteArray = new Uint8Array(arrayBuffer);
      
      // Parse DICOM file
      const dataSet = dicomParser.parseDicom(byteArray);
      
      // Extract image dimensions
      const columns = dataSet.uint16("x00280011") || 512;
      const rows = dataSet.uint16("x00280010") || 512;
      const bitsAllocated = dataSet.uint16("x00280100") || 16;
      const bitsStored = dataSet.uint16("x00280101") || bitsAllocated;
      const highBit = dataSet.uint16("x00280102") || (bitsStored - 1);
      const pixelRepresentation = dataSet.uint16("x00280103") || 0;
      const samplesPerPixel = dataSet.uint16("x00280002") || 1;
      const photometricInterpretation = dataSet.string("x00280004") || "MONOCHROME2";
      
      // Window center/width for display
      let windowCenter = dataSet.floatString("x00281050");
      let windowWidth = dataSet.floatString("x00281051");
      const slope = dataSet.floatString("x00281053") || 1;
      const intercept = dataSet.floatString("x00281052") || 0;
      
      // Multi-frame support
      const numberOfFrames = dataSet.intString("x00280008") || 1;
      const instanceNumber = dataSet.intString("x00200013") || 1;
      const sliceLocation = dataSet.floatString("x00201041") || 0;
      
      // Patient info
      const patientName = dataSet.string("x00100010") || "Unknown";
      const studyDescription = dataSet.string("x00081030") || "N/A";
      const modality = dataSet.string("x00080060") || "Unknown";
      
      // Get pixel data
      const pixelDataElement = dataSet.elements.x7fe00010;
      if (!pixelDataElement) {
        throw new Error("No pixel data found in DICOM file");
      }

      const slices: DicomSlice[] = [];
      const pixelDataOffset = pixelDataElement.dataOffset;
      const pixelDataLength = pixelDataElement.length;
      const pixelCount = rows * columns * samplesPerPixel;
      const bytesPerPixel = bitsAllocated / 8;
      const frameSize = pixelCount * bytesPerPixel;

      // Handle multiple frames/slices
      for (let frame = 0; frame < numberOfFrames; frame++) {
        const frameOffset = pixelDataOffset + (frame * frameSize);
        let pixelData: Int16Array | Uint16Array | Uint8Array;

        try {
          if (bitsAllocated === 16) {
            // For 16-bit data, we need to handle unaligned access
            // Copy the data to a new aligned buffer
            const frameBytes = new Uint8Array(arrayBuffer, frameOffset, Math.min(pixelCount * 2, pixelDataLength - (frame * frameSize)));
            const alignedBuffer = new ArrayBuffer(pixelCount * 2);
            const alignedView = new Uint8Array(alignedBuffer);
            alignedView.set(frameBytes.slice(0, pixelCount * 2));
            
            if (pixelRepresentation === 1) {
              pixelData = new Int16Array(alignedBuffer);
            } else {
              pixelData = new Uint16Array(alignedBuffer);
            }
          } else if (bitsAllocated === 8) {
            pixelData = new Uint8Array(arrayBuffer, frameOffset, Math.min(pixelCount, pixelDataLength - (frame * frameSize)));
          } else {
            // Handle other bit depths by reading as bytes and converting
            const frameBytes = new Uint8Array(arrayBuffer, frameOffset, Math.min(pixelCount * 2, pixelDataLength - (frame * frameSize)));
            const alignedBuffer = new ArrayBuffer(pixelCount * 2);
            const alignedView = new Uint8Array(alignedBuffer);
            alignedView.set(frameBytes.slice(0, pixelCount * 2));
            pixelData = new Uint16Array(alignedBuffer);
          }

          slices.push({
            pixelData,
            instanceNumber: instanceNumber + frame,
            sliceLocation: sliceLocation + frame,
          });
        } catch (frameError) {
          console.warn(`Error processing frame ${frame}:`, frameError);
          // Continue with other frames if one fails
        }
      }

      // If still no slices, try to extract all pixel data as single slice with proper handling
      if (slices.length === 0) {
        let pixelData: Int16Array | Uint16Array | Uint8Array;
        
        if (bitsAllocated === 16) {
          // Copy to aligned buffer for 16-bit data
          const pixelBytes = byteArray.slice(pixelDataOffset, pixelDataOffset + pixelDataLength);
          const alignedBuffer = new ArrayBuffer(pixelBytes.length);
          const alignedView = new Uint8Array(alignedBuffer);
          alignedView.set(pixelBytes);
          
          if (pixelRepresentation === 1) {
            pixelData = new Int16Array(alignedBuffer);
          } else {
            pixelData = new Uint16Array(alignedBuffer);
          }
        } else {
          pixelData = new Uint8Array(arrayBuffer, pixelDataOffset, pixelDataLength);
        }

        slices.push({
          pixelData,
          instanceNumber: 1,
          sliceLocation: 0,
        });
      }

      // Calculate min/max for window if not provided
      if (!windowCenter || !windowWidth || windowCenter === 0 || windowWidth === 0) {
        const firstSlice = slices[0].pixelData;
        let minVal = Infinity;
        let maxVal = -Infinity;
        
        // Sample pixels for faster calculation on large images
        const step = Math.max(1, Math.floor(firstSlice.length / 10000));
        for (let i = 0; i < firstSlice.length; i += step) {
          const val = firstSlice[i] * slope + intercept;
          if (val < minVal) minVal = val;
          if (val > maxVal) maxVal = val;
        }
        
        windowCenter = (minVal + maxVal) / 2;
        windowWidth = Math.max(1, maxVal - minVal);
      }

      setImageData({
        width: columns,
        height: rows,
        windowCenter,
        windowWidth,
        slices,
        slope,
        intercept,
        patientName,
        studyDescription,
        modality,
        bitsAllocated,
        bitsStored,
        highBit,
        photometricInterpretation,
      });

      setCurrentSlice(0);
      toast.success(`DICOM loaded: ${slices.length} slice(s)`);
    } catch (err) {
      console.error("Error loading DICOM:", err);
      setError(err instanceof Error ? err.message : "Failed to load DICOM file");
      toast.error("Failed to load DICOM file");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!file) {
      setImageData(null);
      return;
    }
    loadDicomFile(file);
  }, [file, loadDicomFile]);

  // Render the current slice to canvas
  useEffect(() => {
    if (!imageData || !canvasRef.current || imageData.slices.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height, slices, windowCenter, windowWidth, slope, intercept, photometricInterpretation } = imageData;
    const slice = slices[Math.min(currentSlice, slices.length - 1)];
    const pixelData = slice.pixelData;

    canvas.width = width;
    canvas.height = height;

    const imageDataCanvas = ctx.createImageData(width, height);
    const data = imageDataCanvas.data;

    // Apply windowing with brightness/contrast adjustments
    const adjustedWindowCenter = windowCenter - brightness * (windowWidth / 10);
    const adjustedWindowWidth = windowWidth / Math.max(0.1, contrast);
    const windowMin = adjustedWindowCenter - adjustedWindowWidth / 2;
    const windowMax = adjustedWindowCenter + adjustedWindowWidth / 2;
    const windowRange = windowMax - windowMin;

    // Determine if we need to invert (MONOCHROME1)
    const invert = photometricInterpretation === "MONOCHROME1";

    for (let i = 0; i < pixelData.length && i < width * height; i++) {
      // Apply slope/intercept (Hounsfield units conversion)
      const rawValue = pixelData[i] * slope + intercept;
      
      // Apply windowing with proper clamping
      let normalizedValue: number;
      if (windowRange <= 0) {
        normalizedValue = 128;
      } else if (rawValue <= windowMin) {
        normalizedValue = 0;
      } else if (rawValue >= windowMax) {
        normalizedValue = 255;
      } else {
        normalizedValue = Math.round(((rawValue - windowMin) / windowRange) * 255);
      }

      // Invert if MONOCHROME1
      if (invert) {
        normalizedValue = 255 - normalizedValue;
      }

      // Clamp final value
      normalizedValue = Math.max(0, Math.min(255, normalizedValue));

      const pixelIndex = i * 4;
      data[pixelIndex] = normalizedValue;     // R
      data[pixelIndex + 1] = normalizedValue; // G
      data[pixelIndex + 2] = normalizedValue; // B
      data[pixelIndex + 3] = 255;             // A
    }

    ctx.putImageData(imageDataCanvas, 0, 0);
  }, [imageData, brightness, contrast, currentSlice]);

  // Handle scroll for slice navigation
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!imageData || imageData.slices.length <= 1) return;
    
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1 : -1;
    setCurrentSlice(prev => {
      const newSlice = prev + delta;
      return Math.max(0, Math.min(imageData.slices.length - 1, newSlice));
    });
  }, [imageData]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.25));
  const handleReset = () => {
    setZoom(1);
    setBrightness(0);
    setContrast(1);
    setCurrentSlice(0);
  };
  const handleFit = () => {
    if (!viewerRef.current || !imageData) return;
    const containerWidth = viewerRef.current.clientWidth;
    const containerHeight = viewerRef.current.clientHeight - 50; // Account for controls
    const scaleX = containerWidth / imageData.width;
    const scaleY = containerHeight / imageData.height;
    setZoom(Math.min(scaleX, scaleY) * 0.9);
  };

  const goToPreviousSlice = () => {
    if (!imageData) return;
    setCurrentSlice(prev => Math.max(0, prev - 1));
  };

  const goToNextSlice = () => {
    if (!imageData) return;
    setCurrentSlice(prev => Math.min(imageData.slices.length - 1, prev + 1));
  };

  if (!file) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
        <div className="text-center">
          <RefreshCw className="w-16 h-16 mx-auto mb-4 text-primary animate-spin" />
          <p className="text-muted-foreground">Loading DICOM image...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
        <div className="text-center text-destructive">
          <p className="font-medium">Error loading DICOM</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const totalSlices = imageData?.slices.length || 1;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleZoomIn} title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleZoomOut} title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleFit} title="Fit to Screen">
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleReset} title="Reset">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Slice Navigation */}
        {totalSlices > 1 && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={goToPreviousSlice} disabled={currentSlice === 0}>
              <ChevronUp className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[80px] text-center">
              {currentSlice + 1} / {totalSlices}
            </span>
            <Button size="sm" variant="outline" onClick={goToNextSlice} disabled={currentSlice >= totalSlices - 1}>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Window/Level Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[150px]">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Brightness:</span>
          <Slider
            min={-5}
            max={5}
            step={0.1}
            value={[brightness]}
            onValueChange={(value) => setBrightness(value[0])}
            className="w-full"
          />
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-[150px]">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Contrast:</span>
          <Slider
            min={0.1}
            max={3}
            step={0.1}
            value={[contrast]}
            onValueChange={(value) => setContrast(value[0])}
            className="w-full"
          />
        </div>
      </div>

      {/* Slice Slider (if multiple slices) */}
      {totalSlices > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Slice:</span>
          <Slider
            min={0}
            max={totalSlices - 1}
            step={1}
            value={[currentSlice]}
            onValueChange={(value) => setCurrentSlice(value[0])}
            className="flex-1"
          />
        </div>
      )}

      {/* Image Display */}
      <div
        ref={viewerRef}
        className="aspect-square bg-black rounded-lg flex items-center justify-center overflow-hidden border border-border relative"
        onWheel={handleWheel}
      >
        {imageData ? (
          <canvas
            ref={canvasRef}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center center",
              transition: "transform 0.2s ease",
              maxWidth: "100%",
              maxHeight: "100%",
              imageRendering: "pixelated",
            }}
          />
        ) : (
          <p className="text-muted-foreground">Processing image...</p>
        )}
        
        {/* Slice indicator overlay */}
        {totalSlices > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
            Slice {currentSlice + 1}/{totalSlices} • Scroll to navigate
          </div>
        )}
      </div>

      {/* Image Info */}
      {imageData && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            {imageData.width} × {imageData.height}
          </Badge>
          <Badge variant="secondary">{imageData.modality}</Badge>
          <Badge variant="secondary">{imageData.bitsStored}-bit</Badge>
          <Badge variant="outline">Patient: {imageData.patientName}</Badge>
          <Badge variant="outline">{imageData.studyDescription}</Badge>
          <Badge variant="outline">Zoom: {(zoom * 100).toFixed(0)}%</Badge>
          {imageData.windowCenter && (
            <Badge variant="outline">WC: {Math.round(imageData.windowCenter)} WW: {Math.round(imageData.windowWidth)}</Badge>
          )}
        </div>
      )}
    </div>
  );
}
