import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  Search,
  FileText,
  Users,
  TrendingUp,
  Activity,
  Stethoscope,
  Microscope,
  Heart,
  Bone,
  Eye,
  Filter,
  Calendar,
  User
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { dicomApi, patientsApi, PatientSendDto } from '@/lib/api';
import CDSSAnalysis from '@/components/dicom/CDSSAnalysis';
import { DicomViewer } from '@/components/dicom/DicomViewer';

export default function CDSSPage() {
  const { user, isAdmin } = useAuth();
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedDicomId, setSelectedDicomId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showDicomViewer, setShowDicomViewer] = useState(false);

  // Fetch patients (for filtering DICOM files)
  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: patientsApi.getAll,
    enabled: isAdmin,
  });

  // Fetch all DICOM analyses
  const { data: allAnalyses = [], isLoading: loadingAnalyses } = useQuery({
    queryKey: ['dicom-analyses'],
    queryFn: dicomApi.getAnalyses,
  });

  // Fetch patient DICOM files
  const { data: patientDicoms = [] } = useQuery({
    queryKey: ['dicom-files', selectedPatientId],
    queryFn: () => selectedPatientId ? dicomApi.getPatientDicoms(parseInt(selectedPatientId)) : Promise.resolve([]),
    enabled: !!selectedPatientId,
  });

  // Filter analyses based on search and category
  const filteredAnalyses = allAnalyses.filter(analysis => {
    const matchesSearch = searchTerm === '' ||
      analysis.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.findings.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterCategory === 'all' ||
      getAnalysisCategory(analysis.findings) === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const getAnalysisCategory = (findings: string): string => {
    const lowerFindings = findings.toLowerCase();
    if (lowerFindings.includes('fracture') || lowerFindings.includes('bone')) return 'orthopedic';
    if (lowerFindings.includes('lung') || lowerFindings.includes('pulmonary')) return 'pulmonary';
    if (lowerFindings.includes('heart') || lowerFindings.includes('cardiac')) return 'cardiac';
    if (lowerFindings.includes('brain') || lowerFindings.includes('neurological')) return 'neurological';
    return 'general';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'orthopedic': return <Bone className="w-4 h-4" />;
      case 'pulmonary': return <Activity className="w-4 h-4" />;
      case 'cardiac': return <Heart className="w-4 h-4" />;
      case 'neurological': return <Brain className="w-4 h-4" />;
      case 'ophthalmic': return <Eye className="w-4 h-4" />;
      default: return <Stethoscope className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (confidence: number): "default" | "destructive" | "secondary" | "outline" => {
    if (confidence > 0.8) return 'destructive';
    if (confidence > 0.6) return 'secondary';
    return 'default';
  };

  // Statistics
  const totalAnalyses = allAnalyses.length;
  const highConfidenceAnalyses = allAnalyses.filter(a => a.confidence > 0.8).length;
  const recentAnalyses = allAnalyses.filter(a => {
    const analysisDate = new Date(a.analyzedAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return analysisDate > weekAgo;
  }).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clinical Decision Support System"
        description="AI-powered medical imaging analysis and diagnostic support"
      />

      {/* Statistics Dashboard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center">
            <Brain className="h-4 w-4 text-muted-foreground" />
            <div className="ml-2">
              <p className="text-sm font-medium text-muted-foreground">Total Analyses</p>
              <p className="text-2xl font-bold">{totalAnalyses}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <div className="ml-2">
              <p className="text-sm font-medium text-muted-foreground">High Confidence</p>
              <p className="text-2xl font-bold text-green-600">{highConfidenceAnalyses}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 text-blue-600" />
            <div className="ml-2">
              <p className="text-sm font-medium text-muted-foreground">This Week</p>
              <p className="text-2xl font-bold text-blue-600">{recentAnalyses}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <Users className="h-4 w-4 text-purple-600" />
            <div className="ml-2">
              <p className="text-sm font-medium text-muted-foreground">Active Patients</p>
              <p className="text-2xl font-bold text-purple-600">
                {new Set(allAnalyses.map(a => a.patientId)).size}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="analysis" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analysis">DICOM Analysis</TabsTrigger>
          <TabsTrigger value="history">Analysis History</TabsTrigger>
          <TabsTrigger value="reports">Reports & Insights</TabsTrigger>
        </TabsList>

        {/* DICOM Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Patient Selection */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Patient Selection
              </h3>

              <div className="space-y-4">
                {isAdmin && (
                  <div>
                    <Label htmlFor="patient">Select Patient</Label>
                    <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((patient: PatientSendDto) => (
                          <SelectItem key={patient.id} value={patient.id.toString()}>
                            {patient.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {patientDicoms.length > 0 && (
                  <div>
                    <Label htmlFor="dicom">Select DICOM File</Label>
                    <Select value={selectedDicomId} onValueChange={setSelectedDicomId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a DICOM file" />
                      </SelectTrigger>
                      <SelectContent>
                        {patientDicoms.map((dicom) => (
                          <SelectItem key={dicom.id} value={dicom.id}>
                            {dicom.fileName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedDicomId && (
                  <Button
                    onClick={() => setShowDicomViewer(true)}
                    className="w-full"
                  >
                    Open DICOM Viewer
                  </Button>
                )}
              </div>
            </Card>

            {/* CDSS Analysis Panel */}
            <div className="lg:col-span-2">
              {selectedDicomId ? (
                <CDSSAnalysis
                  dicomId={selectedDicomId}
                  patientId={selectedPatientId ? parseInt(selectedPatientId) : undefined}
                  onAnalysisComplete={(result) => {
                    console.log('CDSS Analysis completed:', result);
                  }}
                />
              ) : (
                <Card className="p-8 text-center">
                  <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Select a DICOM File</h3>
                  <p className="text-muted-foreground">
                    Choose a patient and DICOM file to begin AI-powered clinical analysis
                  </p>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Analysis History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Analysis History</h3>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search analyses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="orthopedic">Orthopedic</SelectItem>
                    <SelectItem value="pulmonary">Pulmonary</SelectItem>
                    <SelectItem value="cardiac">Cardiac</SelectItem>
                    <SelectItem value="neurological">Neurological</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <ScrollArea className="h-96">
              {loadingAnalyses ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading analysis history...</p>
                </div>
              ) : filteredAnalyses.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No analyses found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAnalyses.map((analysis, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(getAnalysisCategory(analysis.findings))}
                          <span className="font-medium">{analysis.fileName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getSeverityColor(analysis.confidence)}>
                            {(analysis.confidence * 100).toFixed(1)}%
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(analysis.analyzedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm">
                          <strong>Findings:</strong> {analysis.findings}
                        </p>
                        <p className="text-sm">
                          <strong>Recommendations:</strong> {analysis.recommendations}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* Reports & Insights Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Analysis Insights</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Most Common Findings</span>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Confidence Distribution</span>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Category Breakdown</span>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Clinical Guidelines</h3>
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium text-sm">Radiology Best Practices</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    AI analysis should always be reviewed by qualified medical professionals.
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium text-sm">Diagnostic Confidence</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    High confidence (&gt;80%) results may require immediate clinical attention.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* DICOM Viewer Modal */}
      <DicomViewer
        open={showDicomViewer}
        onOpenChange={setShowDicomViewer}
        dicomId={selectedDicomId}
        patientId={selectedPatientId ? parseInt(selectedPatientId) : undefined}
      />
    </div>
  );
}