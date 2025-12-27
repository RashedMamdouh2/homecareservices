import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, ZoomIn, ZoomOut, RotateCcw, Brain, FileImage } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery } from "@tanstack/react-query";
import { dicomApi, DicomUploadResponse, DicomAnalysisResult, DicomUploadRequest } from "@/lib/api";
import { DicomUploadForm } from "@/components/dicom/DicomUploadForm";

export default function DicomViewer() {
  const [uploadedFiles, setUploadedFiles] = useState<DicomUploadResponse[]>([]);
  const [selectedFile, setSelectedFile] = useState<DicomUploadResponse | null>(null);
  const [analysis, setAnalysis] = useState<DicomAnalysisResult | null>(null);

  // Fetch existing analyses
  const { data: analyses = [] } = useQuery({
    queryKey: ['dicom-analyses'],
    queryFn: dicomApi.getAnalyses,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: dicomApi.uploadDicom,
    onSuccess: (data) => {
      setUploadedFiles(prev => [...prev, data]);
      setSelectedFile(data);
      toast.success("DICOM file uploaded successfully");
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error("Failed to upload DICOM file");
    },
  });

  // Analysis mutation
  const analyzeMutation = useMutation({
    mutationFn: dicomApi.analyzeDicom,
    onSuccess: (data) => {
      setAnalysis(data);
      toast.success("Analysis complete");
    },
    onError: (error) => {
      console.error('Analysis error:', error);
      toast.error("Failed to analyze DICOM file");
    },
  });

  const handleUpload = (data: DicomUploadRequest) => {
    uploadMutation.mutate(data);
  };

  const handleAnalysis = async () => {
    if (!selectedFile) return;
    analyzeMutation.mutate(selectedFile.id);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="DICOM Viewer & CDSS" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* File Upload Form */}
        <DicomUploadForm 
          onUpload={handleUpload}
          isUploading={uploadMutation.isPending}
        />

        {/* Viewer */}
        <Card className="p-6 lg:col-span-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">DICOM Viewer</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
              {selectedFile ? (
                <div className="text-center">
                  <FileImage className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="font-medium">{selectedFile.fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    DICOM image loaded - Interactive viewing available
                  </p>
                  <div className="flex justify-center gap-2 mt-4">
                    <Badge variant="secondary">Windowing</Badge>
                    <Badge variant="secondary">MPR</Badge>
                    <Badge variant="secondary">3D Render</Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Eye className="w-16 h-16 mx-auto mb-4" />
                  <p>Select a DICOM file to view</p>
                </div>
              )}
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Uploaded Files:</h4>
                <div className="grid gap-2">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedFile?.id === file.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedFile(file)}
                    >
                      <div className="flex items-center gap-2">
                        <FileImage className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium truncate">{file.fileName}</span>
                        <Badge variant="outline" className="text-xs ml-auto">
                          {new Date(file.uploadedAt).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* CDSS Analysis */}
      {selectedFile && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6 text-primary" />
              <h3 className="text-lg font-semibold">Clinical Decision Support System</h3>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleAnalysis}
                disabled={analyzeMutation.isPending || !selectedFile}
                className="flex items-center gap-2"
              >
                <Brain className="w-4 h-4" />
                {analyzeMutation.isPending ? "Analyzing..." : "Run AI Analysis"}
              </Button>
              <Badge variant="outline">Powered by ML Models</Badge>
              <Badge variant="outline">Clinical Guidelines</Badge>
            </div>

            {analysis && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Analysis Results</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Findings:</strong> {analysis.findings}</div>
                  <div><strong>Confidence:</strong> {analysis.confidence}%</div>
                  <div><strong>Recommendations:</strong> {analysis.recommendations}</div>
                  <div><strong>Analyzed:</strong> {new Date(analysis.analyzedAt).toLocaleString()}</div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Features Grid */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Available Tools</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <ZoomIn className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className="font-medium">Zoom & Pan</div>
            <div className="text-sm text-muted-foreground">Interactive navigation</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <Eye className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className="font-medium">Windowing</div>
            <div className="text-sm text-muted-foreground">Adjust contrast/brightness</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <RotateCcw className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className="font-medium">MPR</div>
            <div className="text-sm text-muted-foreground">Multi-planar reconstruction</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <Brain className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className="font-medium">3D Rendering</div>
            <div className="text-sm text-muted-foreground">Volume visualization</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
