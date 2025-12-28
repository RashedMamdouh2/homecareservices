import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Brain,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
  Activity,
  Stethoscope,
  Microscope,
  Heart,
  Bone,
  Eye,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { dicomApi, DicomAnalysisResult } from '@/lib/api';

interface CDSSAnalysisProps {
  dicomId: string;
  patientId?: number;
  onAnalysisComplete?: (result: DicomAnalysisResult) => void;
}

interface AnalysisMetrics {
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  biomarkers: string[];
  riskFactors: string[];
}

export default function CDSSAnalysis({ dicomId, patientId, onAnalysisComplete }: CDSSAnalysisProps) {
  const [currentAnalysis, setCurrentAnalysis] = useState<DicomAnalysisResult | null>(null);
  const [analysisMetrics, setAnalysisMetrics] = useState<AnalysisMetrics | null>(null);

  // Analyze DICOM file
  const analyzeMutation = useMutation({
    mutationFn: dicomApi.analyzeDicom,
    onSuccess: (result: DicomAnalysisResult) => {
      setCurrentAnalysis(result);
      generateAnalysisMetrics(result);
      onAnalysisComplete?.(result);
      toast.success('DICOM analysis completed successfully');
    },
    onError: (error) => {
      console.error('Analysis failed:', error);
      toast.error('Failed to analyze DICOM file');
    },
  });

  // Get analysis history
  const { data: analysisHistory = [] } = useQuery({
    queryKey: ['dicom-analyses', patientId],
    queryFn: dicomApi.getAnalyses,
    enabled: !!patientId,
  });

  const generateAnalysisMetrics = (result: DicomAnalysisResult) => {
    // Simulate analysis metrics based on findings
    const confidence = result.confidence;
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let category = 'General';

    // Determine severity based on confidence and findings
    if (confidence > 0.8) {
      severity = 'critical';
    } else if (confidence > 0.6) {
      severity = 'high';
    } else if (confidence > 0.4) {
      severity = 'medium';
    }

    // Determine category based on findings keywords
    const findings = result.findings.toLowerCase();
    if (findings.includes('fracture') || findings.includes('bone')) {
      category = 'Orthopedic';
    } else if (findings.includes('lung') || findings.includes('pulmonary')) {
      category = 'Pulmonary';
    } else if (findings.includes('heart') || findings.includes('cardiac')) {
      category = 'Cardiac';
    } else if (findings.includes('brain') || findings.includes('neurological')) {
      category = 'Neurological';
    }

    // Extract biomarkers and risk factors from findings
    const biomarkers = extractBiomarkers(result.findings);
    const riskFactors = extractRiskFactors(result.findings);

    setAnalysisMetrics({
      confidence,
      severity,
      category,
      biomarkers,
      riskFactors,
    });
  };

  const extractBiomarkers = (findings: string): string[] => {
    const biomarkerKeywords = [
      'density', 'opacity', 'calcification', 'mass', 'nodule', 'lesion',
      'edema', 'inflammation', 'atrophy', 'hypertrophy', 'stenosis'
    ];

    return biomarkerKeywords.filter(keyword =>
      findings.toLowerCase().includes(keyword)
    );
  };

  const extractRiskFactors = (findings: string): string[] => {
    const riskKeywords = [
      'smoking', 'age', 'family history', 'obesity', 'hypertension',
      'diabetes', 'chronic', 'recurrent', 'progressive'
    ];

    return riskKeywords.filter(keyword =>
      findings.toLowerCase().includes(keyword)
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'orthopedic': return <Bone className="w-4 h-4" />;
      case 'pulmonary': return <Activity className="w-4 h-4" />;
      case 'cardiac': return <Heart className="w-4 h-4" />;
      case 'neurological': return <Brain className="w-4 h-4" />;
      case 'ophthalmic': return <Eye className="w-4 h-4" />;
      default: return <Stethoscope className="w-4 h-4" />;
    }
  };

  const handleAnalyze = () => {
    if (dicomId) {
      analyzeMutation.mutate(dicomId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Analysis Control */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold">Clinical Decision Support System</h3>
              <p className="text-sm text-muted-foreground">
                AI-powered analysis of medical imaging
              </p>
            </div>
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={analyzeMutation.isPending || !dicomId}
            className="flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            {analyzeMutation.isPending ? 'Analyzing...' : 'Analyze DICOM'}
          </Button>
        </div>

        {analyzeMutation.isPending && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="w-4 h-4 animate-pulse" />
              Processing DICOM image with AI algorithms...
            </div>
            <Progress value={undefined} className="w-full" />
          </div>
        )}
      </Card>

      {/* Current Analysis Results */}
      {currentAnalysis && analysisMetrics && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Analysis Summary */}
          <Card className="p-6">
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Analysis Summary
            </h4>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Confidence Level</span>
                <div className="flex items-center gap-2">
                  <Progress value={analysisMetrics.confidence * 100} className="w-20" />
                  <span className="text-sm font-medium">
                    {(analysisMetrics.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Severity</span>
                <Badge variant={getSeverityColor(analysisMetrics.severity)} className="flex items-center gap-1">
                  {getSeverityIcon(analysisMetrics.severity)}
                  {analysisMetrics.severity.toUpperCase()}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Category</span>
                <Badge variant="outline" className="flex items-center gap-1">
                  {getCategoryIcon(analysisMetrics.category)}
                  {analysisMetrics.category}
                </Badge>
              </div>

              <Separator />

              <div>
                <h5 className="text-sm font-medium mb-2">Key Findings</h5>
                <p className="text-sm text-muted-foreground">{currentAnalysis.findings}</p>
              </div>

              <div>
                <h5 className="text-sm font-medium mb-2">Clinical Recommendations</h5>
                <p className="text-sm text-muted-foreground">{currentAnalysis.recommendations}</p>
              </div>
            </div>
          </Card>

          {/* Detailed Metrics */}
          <Card className="p-6">
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Detailed Metrics
            </h4>

            <div className="space-y-4">
              {analysisMetrics.biomarkers.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium mb-2">Detected Biomarkers</h5>
                  <div className="flex flex-wrap gap-2">
                    {analysisMetrics.biomarkers.map((biomarker, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {biomarker}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {analysisMetrics.riskFactors.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium mb-2">Risk Factors Identified</h5>
                  <div className="flex flex-wrap gap-2">
                    {analysisMetrics.riskFactors.map((risk, index) => (
                      <Badge key={index} variant="destructive" className="text-xs">
                        {risk}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              <div className="text-xs text-muted-foreground">
                <p>Analysis performed on: {new Date(currentAnalysis.analyzedAt).toLocaleString()}</p>
                <p>File: {currentAnalysis.fileName}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Analysis History */}
      {analysisHistory.length > 0 && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Analysis History
          </h4>

          <ScrollArea className="h-64">
            <div className="space-y-3">
              {analysisHistory.map((analysis, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{analysis.fileName}</span>
                    <Badge variant="outline" className="text-xs">
                      {(analysis.confidence * 100).toFixed(1)}% confidence
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{analysis.findings}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(analysis.analyzedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}

      {/* Clinical Alerts */}
      {currentAnalysis && analysisMetrics && analysisMetrics.severity === 'critical' && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Critical Findings Detected</AlertTitle>
          <AlertDescription className="text-red-700">
            This analysis indicates potentially critical findings that require immediate clinical attention.
            Please review the recommendations and consider urgent follow-up.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}