import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { specializationsApi, PhysicianSendDto } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/common/PageHeader";
import { PageLoader } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { SpecializationCard } from "@/components/specializations/SpecializationCard";
import { AddSpecializationDialog } from "@/components/specializations/AddSpecializationDialog";
import { PhysicianCard } from "@/components/physicians/PhysicianCard";
import { Layers, Search, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Specializations() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedSpecId, setSelectedSpecId] = useState<number | null>(null);
  const { isAdmin } = useAuth();

  const { data: specializations, isLoading: loadingSpecs } = useQuery({
    queryKey: ["specializations"],
    queryFn: specializationsApi.getAll,
  });

  const { data: physicians, isLoading: loadingPhysicians } = useQuery({
    queryKey: ["specialization-physicians", selectedSpecId],
    queryFn: () => specializationsApi.getPhysicians(selectedSpecId!),
    enabled: selectedSpecId !== null,
  });

  const selectedSpec = specializations?.find(s => s.id === selectedSpecId);

  const filteredSpecs = specializations?.filter(spec =>
    spec.name.toLowerCase().includes(search.toLowerCase()) ||
    spec.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loadingSpecs) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Specializations"
        description="Browse medical specializations and their physicians"
        action={isAdmin ? <AddSpecializationDialog /> : undefined}
      />

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search specializations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Specializations List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            All Specializations ({filteredSpecs?.length || 0})
          </h2>
          
          {filteredSpecs && filteredSpecs.length > 0 ? (
            <div className="space-y-3">
              {filteredSpecs.map((spec) => (
                <SpecializationCard
                  key={spec.id}
                  specialization={spec}
                  onClick={() => setSelectedSpecId(spec.id)}
                  isSelected={selectedSpecId === spec.id}
                  showActions={isAdmin}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Layers}
              title={search ? "No specializations found" : "No specializations yet"}
              description={
                search
                  ? "Try adjusting your search terms."
                  : "Add your first specialization to get started."
              }
              action={!search && isAdmin && <AddSpecializationDialog />}
            />
          )}
        </div>

        {/* Physicians Panel */}
        <div className="space-y-4">
          {selectedSpec ? (
            <>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedSpecId(null)}
                  className="lg:hidden"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <h2 className="text-lg font-semibold text-foreground">
                  {selectedSpec.name} Physicians
                </h2>
              </div>

              {loadingPhysicians ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : physicians && physicians.length > 0 ? (
                <div className="grid gap-4">
                  {physicians.map((physician) => (
                    <PhysicianCard 
                      key={physician.id} 
                      physician={physician} 
                      showActions={false}
                      onClick={() => navigate(`/physician-profile/${physician.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Layers}
                  title="No physicians found"
                  description={`No physicians are registered under ${selectedSpec.name} yet.`}
                />
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Layers className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground mb-1">Select a Specialization</h3>
              <p className="text-sm text-muted-foreground">
                Click on a specialization to view its physicians
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
