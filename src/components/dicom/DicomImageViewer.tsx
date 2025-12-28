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

interface DicomImageData {
  width: number;
  height: number;
  windowCenter: number;
  windowWidth: number;
  pixelData: number[];
  slope: number;
  intercept: number;
  patientName: string;
  studyDescription: string;
  modality: string;
  bitsAllocated: number;
  bitsStored: number;
  minPixelValue: number;
  maxPixelValue: number;
  photometricInterpretation: string;
}

export function DicomImageViewer({ file }: DicomImageViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageData, setImageData] = useState<DicomImageData | null>(null);
  const [zoom, setZoom] = useState(1);
  const [windowCenter, setWindowCenter] = useState<number>(0);
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const pixelRepresentation = dataSet.uint16("x00280103") || 0;
      const photometricInterpretation = dataSet.string("x00280004") || "MONOCHROME2";
      
      // Rescale slope/intercept (for Hounsfield units in CT)
      const slope = dataSet.floatString("x00281053") || 1;
      const intercept = dataSet.floatString("x00281052") || 0;
      
      // Patient info
      const patientName = dataSet.string("x00100010") || "Unknown";
      const studyDescription = dataSet.string("x00081030") || "N/A";
      const modality = dataSet.string("x00080060") || "Unknown";
      
      // Get pixel data element
      const pixelDataElement = dataSet.elements.x7fe00010;
      if (!pixelDataElement) {
        throw new Error("No pixel data found in DICOM file");
      }

      // Extract pixel values properly
      const pixelDataOffset = pixelDataElement.dataOffset;
      const pixelDataLength = pixelDataElement.length;
      const numPixels = rows * columns;
      
      // Convert raw bytes to pixel values based on bits allocated
      const pixelValues: number[] = new Array(numPixels);
      
      if (bitsAllocated === 16) {
        // 16-bit pixels - read as little-endian
        for (let i = 0; i < numPixels; i++) {
          const offset = pixelDataOffset + (i * 2);
          if (offset + 1 < byteArray.length) {
            let value = byteArray[offset] | (byteArray[offset + 1] << 8);
            // Handle signed values
            if (pixelRepresentation === 1 && value > 32767) {
              value = value - 65536;
            }
            pixelValues[i] = value;
          } else {
            pixelValues[i] = 0;
          }
        }
      } else if (bitsAllocated === 8) {
        // 8-bit pixels
        for (let i = 0; i < numPixels; i++) {
          const offset = pixelDataOffset + i;
          if (offset < byteArray.length) {
            pixelValues[i] = byteArray[offset];
          } else {
            pixelValues[i] = 0;
          }
        }
      } else {
        // Default to 16-bit
        for (let i = 0; i < numPixels; i++) {
          const offset = pixelDataOffset + (i * 2);
          if (offset + 1 < byteArray.length) {
            pixelValues[i] = byteArray[offset] | (byteArray[offset + 1] << 8);
          } else {
            pixelValues[i] = 0;
          }
        }
      }

      // Apply rescale slope/intercept and find min/max
      let minVal = Infinity;
      let maxVal = -Infinity;
      
      for (let i = 0; i < pixelValues.length; i++) {
        const rescaledValue = pixelValues[i] * slope + intercept;
        pixelValues[i] = rescaledValue;
        if (rescaledValue < minVal) minVal = rescaledValue;
        if (rescaledValue > maxVal) maxVal = rescaledValue;
      }

      // Get window center/width from DICOM or calculate
      let wc = dataSet.floatString("x00281050");
      let ww = dataSet.floatString("x00281051");
      
      // If window values not in DICOM or invalid, calculate from pixel range
      if (!wc || !ww || ww <= 0) {
        wc = (minVal + maxVal) / 2;
        ww = Math.max(1, maxVal - minVal);
      }

      setImageData({
        width: columns,
        height: rows,
        windowCenter: wc,
        windowWidth: ww,
        pixelData: pixelValues,
        slope,
        intercept,
        patientName,
        studyDescription,
        modality,
        bitsAllocated,
        bitsStored,
        minPixelValue: minVal,
        maxPixelValue: maxVal,
        photometricInterpretation,
      });

      setWindowCenter(wc);
      setWindowWidth(ww);
      
      console.log('DICOM loaded:', {
        dimensions: `${columns}x${rows}`,
        bits: bitsAllocated,
        pixelRange: `${minVal} to ${maxVal}`,
        window: `C:${wc} W:${ww}`,
        modality,
        photometric: photometricInterpretation
      });
      
      toast.success(`DICOM loaded: ${columns}x${rows}`);
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

  // Render the image to canvas
  useEffect(() => {
    if (!imageData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height, pixelData, photometricInterpretation } = imageData;

    canvas.width = width;
    canvas.height = height;

    const imageDataCanvas = ctx.createImageData(width, height);
    const data = imageDataCanvas.data;

    // Calculate window bounds
    const windowMin = windowCenter - windowWidth / 2;
    const windowMax = windowCenter + windowWidth / 2;
    const windowRange = windowMax - windowMin;

    // Determine if we need to invert (MONOCHROME1 = bone white, air black - need to invert)
    const invert = photometricInterpretation === "MONOCHROME1";

    for (let i = 0; i < pixelData.length && i < width * height; i++) {
      const pixelValue = pixelData[i];
      
      // Apply windowing
      let normalizedValue: number;
      if (windowRange <= 0) {
        normalizedValue = 128;
      } else if (pixelValue <= windowMin) {
        normalizedValue = 0;
      } else if (pixelValue >= windowMax) {
        normalizedValue = 255;
      } else {
        normalizedValue = Math.round(((pixelValue - windowMin) / windowRange) * 255);
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
  }, [imageData, windowCenter, windowWidth]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.25));
  const handleReset = () => {
    setZoom(1);
    if (imageData) {
      setWindowCenter(imageData.windowCenter);
      setWindowWidth(imageData.windowWidth);
    }
  };
  const handleFit = () => {
    if (!viewerRef.current || !imageData) return;
    const containerWidth = viewerRef.current.clientWidth;
    const containerHeight = viewerRef.current.clientHeight - 50;
    const scaleX = containerWidth / imageData.width;
    const scaleY = containerHeight / imageData.height;
    setZoom(Math.min(scaleX, scaleY) * 0.9);
  };

  // Auto-window presets for common modalities
  const applyPreset = (preset: string) => {
    if (!imageData) return;
    
    switch (preset) {
      case 'brain':
        setWindowCenter(40);
        setWindowWidth(80);
        break;
      case 'lung':
        setWindowCenter(-600);
        setWindowWidth(1500);
        break;
      case 'bone':
        setWindowCenter(300);
        setWindowWidth(1500);
        break;
      case 'abdomen':
        setWindowCenter(40);
        setWindowWidth(400);
        break;
      case 'auto':
        setWindowCenter(imageData.windowCenter);
        setWindowWidth(imageData.windowWidth);
        break;
      case 'full':
        const center = (imageData.minPixelValue + imageData.maxPixelValue) / 2;
        const width = imageData.maxPixelValue - imageData.minPixelValue;
        setWindowCenter(center);
        setWindowWidth(width);
        break;
    }
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
      </div>

      {/* Window Presets */}
      <div className="flex flex-wrap gap-1">
        <Button size="sm" variant="secondary" onClick={() => applyPreset('auto')}>Auto</Button>
        <Button size="sm" variant="secondary" onClick={() => applyPreset('full')}>Full</Button>
        <Button size="sm" variant="secondary" onClick={() => applyPreset('brain')}>Brain</Button>
        <Button size="sm" variant="secondary" onClick={() => applyPreset('lung')}>Lung</Button>
        <Button size="sm" variant="secondary" onClick={() => applyPreset('bone')}>Bone</Button>
        <Button size="sm" variant="secondary" onClick={() => applyPreset('abdomen')}>Abdomen</Button>
      </div>

      {/* Window/Level Controls */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-24">Window Center: {Math.round(windowCenter)}</span>
          <Slider
            min={imageData?.minPixelValue || -1000}
            max={imageData?.maxPixelValue || 3000}
            step={1}
            value={[windowCenter]}
            onValueChange={(value) => setWindowCenter(value[0])}
            className="flex-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-24">Window Width: {Math.round(windowWidth)}</span>
          <Slider
            min={1}
            max={Math.max(4000, (imageData?.maxPixelValue || 4000) - (imageData?.minPixelValue || 0))}
            step={1}
            value={[windowWidth]}
            onValueChange={(value) => setWindowWidth(value[0])}
            className="flex-1"
          />
        </div>
      </div>

      {/* Image Display */}
      <div
        ref={viewerRef}
        className="aspect-square bg-black rounded-lg flex items-center justify-center overflow-hidden border border-border relative"
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
            }}
          />
        ) : (
          <p className="text-muted-foreground">Processing image...</p>
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
          <Badge variant="outline">
            Range: {Math.round(imageData.minPixelValue)} to {Math.round(imageData.maxPixelValue)}
          </Badge>
        </div>
      )}
    </div>
  );
}
