import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { patientsApi } from "@/lib/api";
import { PageHeader } from "@/components/common/PageHeader";
import { PatientCard } from "@/components/patients/PatientCard";
import { PageLoader } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { AddPatientDialog } from "@/components/patients/AddPatientDialog";

export default function Patients() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const { data: patients, isLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: patientsApi.getAll,
  });

  if (isLoading) {
    return <PageLoader />;
  }

  const filteredPatients = patients?.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search)
  ) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patients"
        description="Manage your patient records and information"
        action={<AddPatientDialog />}
      />

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search patients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Patients Grid */}
      {filteredPatients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient, index) => (
            <div
              key={patient.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <PatientCard 
                patient={patient} 
                onClick={() => navigate(`/patient-profile/${patient.id}`)}
              />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title={search ? "No patients found" : "No patients yet"}
          description={
            search
              ? "Try adjusting your search terms"
              : "Register your first patient to get started."
          }
          action={
            !search && <AddPatientDialog />
          }
        />
      )}
    </div>
  );
}
