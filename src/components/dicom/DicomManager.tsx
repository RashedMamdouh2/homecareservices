import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Eye,
  Upload,
  Download,
  Trash2,
  FileImage,
  Calendar,
  User,
  Stethoscope,
} from 'lucide-react';
import { DicomViewer } from './DicomViewer';
import { dicomApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface DicomManagerProps {
  patientId: number;
}

export function DicomManager({ patientId }: DicomManagerProps) {
  const { isPatient, isAdmin } = useAuth();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedDicomId, setSelectedDicomId] = useState<string | null>(null);

  // Fetch DICOM files for patient
  const { data: dicomFiles, isLoading, refetch } = useQuery({
    queryKey: ['dicom-files', patientId],
    queryFn: () => dicomApi.getPatientDicoms(patientId),
  });

  const handleViewDicom = (dicomId: string) => {
    setSelectedDicomId(dicomId);
    setViewerOpen(true);
  };

  const handleDownloadDicom = async (dicomId: string, fileName: string) => {
    try {
      const blob = await dicomApi.downloadDicom(dicomId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download DICOM file:', error);
    }
  };

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileImage className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Medical Imaging (DICOM)</h3>
          </div>
          {(isAdmin || !isPatient) && (
            <Button
              onClick={() => {
                setSelectedDicomId(null);
                setViewerOpen(true);
              }}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload DICOM
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : dicomFiles && dicomFiles.length > 0 ? (
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {dicomFiles.map((file) => (
                <Card key={file.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileImage className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">{file.fileName}</span>
                        <Badge variant="outline" className="text-xs">
                          DICOM
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(file.uploadedAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Patient ID: {patientId}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDicom(file.id)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadDicom(file.id, file.fileName)}
                        className="flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-12">
            <FileImage className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h4 className="text-lg font-medium mb-2">No DICOM files found</h4>
            <p className="text-muted-foreground mb-4">
              Upload medical imaging files to view and analyze them with our advanced DICOM viewer.
            </p>
            {(isAdmin || !isPatient) && (
              <Button
                onClick={() => {
                  setSelectedDicomId(null);
                  setViewerOpen(true);
                }}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload First DICOM File
              </Button>
            )}
          </div>
        )}
      </Card>

      <DicomViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        dicomId={selectedDicomId || undefined}
        patientId={patientId}
      />
    </>
  );
}