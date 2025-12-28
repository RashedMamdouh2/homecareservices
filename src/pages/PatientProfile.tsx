import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { patientsApi, patientMedicalApi, getAssetUrl } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AddDiagnosisDialog } from "@/components/patients/AddDiagnosisDialog";
import { DicomManager } from "@/components/dicom";
import {
  User,
  Phone,
  MapPin,
  ArrowLeft,
  Pill,
  Stethoscope,
  Clock,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";

export default function PatientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isPatient, isPhysician } = useAuth();

  // Use current user's patientId if they're a patient viewing their own profile
  const patientId = id ? parseInt(id) : user?.patientId;

  const { data: patient, isLoading: loadingPatient } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => patientsApi.getById(patientId!),
    enabled: !!patientId,
  });

  const { data: diseases, isLoading: loadingDiseases } = useQuery({
    queryKey: ["patient-diseases", patientId],
    queryFn: () => patientMedicalApi.getDiseases(patientId!),
    enabled: !!patientId,
  });

  const { data: medicines, isLoading: loadingMedicines } = useQuery({
    queryKey: ["patient-medicines", patientId],
    queryFn: () => patientMedicalApi.getMedicines(patientId!),
    enabled: !!patientId,
  });

  if (loadingPatient) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Patient not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {!isPatient && (
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <PageHeader
          title="Patient Profile"
          description="View patient details and medical records"
        />
      </div>

      {/* Patient Info Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-accent to-primary/20 flex items-center justify-center flex-shrink-0">
            {getAssetUrl(patient.image) ? (
              <img
                src={getAssetUrl(patient.image)!}
                alt={patient.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-16 h-16 text-primary" />
            )}
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-semibold text-card-foreground">
                {patient.name}
              </h2>
              <Badge className="mt-2">{patient.gender}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Phone className="w-5 h-5 text-primary" />
                <span>{patient.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="w-5 h-5 text-primary" />
                <span>
                  {patient.address}, {patient.city}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Medical Records Section */}
      <div className="space-y-6">
        {/* Medical Conditions and Medications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Diseases */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">
                    Medical Conditions
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Diagnosed diseases
                  </p>
                </div>
              </div>
              {isPhysician && patientId && (
                <AddDiagnosisDialog patientId={patientId} />
              )}
            </div>
            <ScrollArea className="h-[300px]">
              {loadingDiseases ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : diseases?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No medical conditions recorded
                </p>
              ) : (
                <div className="space-y-3">
                  {diseases?.map((disease, index) => (
                    <div
                      key={`${disease.icd}-${index}`}
                      className="p-4 rounded-lg bg-muted/50 border border-border"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-card-foreground">
                          {disease.diseaseName}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          ICD: {disease.icd}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Diagnosed: {format(new Date(disease.diagnosisDate), "MMM d, yyyy")}</span>
                        </div>
                        {disease.recoverdDate && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span>Recovered: {format(new Date(disease.recoverdDate), "MMM d, yyyy")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>

          {/* Medicines */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Pill className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Medications</h3>
                <p className="text-sm text-muted-foreground">
                  Prescribed medicines
                </p>
              </div>
            </div>
            <ScrollArea className="h-[300px]">
              {loadingMedicines ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : medicines?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No medications recorded
                </p>
              ) : (
                <div className="space-y-3">
                  {medicines?.map((medicine, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg bg-muted/50 border border-border"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-card-foreground">
                              {medicine.name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {medicine.description}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            {medicine.dose}g x{medicine.doseFrequency}/day
                          </Badge>
                        </div>
                        {medicine.usageTimes && medicine.usageTimes.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            {medicine.usageTimes.map((time, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {formatTime(time)}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>

        {/* DICOM Medical Imaging */}
        {patientId && <DicomManager patientId={patientId} />}
      </div>
    </div>
  );
}
