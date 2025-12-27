import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { physiciansApi, specializationsApi } from "@/lib/api";
import { PageHeader } from "@/components/common/PageHeader";
import { PhysicianCard } from "@/components/physicians/PhysicianCard";
import { PageLoader } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { Stethoscope, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { AddPhysicianDialog } from "@/components/physicians/AddPhysicianDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Physicians() {
  const [search, setSearch] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("all");
  const navigate = useNavigate();

  const { data: physicians, isLoading: physiciansLoading } = useQuery({
    queryKey: ["physicians"],
    queryFn: physiciansApi.getAll,
  });

  const { data: specializations } = useQuery({
    queryKey: ["specializations"],
    queryFn: specializationsApi.getAll,
  });

  if (physiciansLoading) {
    return <PageLoader />;
  }

  const filteredPhysicians = physicians?.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.specializationName.toLowerCase().includes(search.toLowerCase()) ||
      p.clinicalAddress.toLowerCase().includes(search.toLowerCase());
    
    const matchesSpecialization =
      selectedSpecialization === "all" ||
      p.specializationName === selectedSpecialization;

    return matchesSearch && matchesSpecialization;
  }) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Physicians"
        description="Our team of qualified healthcare professionals"
        action={<AddPhysicianDialog />}
      />

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search physicians..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="All Specializations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specializations</SelectItem>
            {specializations?.map((spec) => (
              <SelectItem key={spec.id} value={spec.name}>
                {spec.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Physicians Grid */}
      {filteredPhysicians.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPhysicians.map((physician, index) => (
            <div
              key={physician.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <PhysicianCard 
                physician={physician} 
                onClick={() => navigate(`/physician-profile/${physician.id}`)}
              />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Stethoscope}
          title={search || selectedSpecialization !== "all" ? "No physicians found" : "No physicians yet"}
          description={
            search || selectedSpecialization !== "all"
              ? "Try adjusting your search or filter"
              : "Add your first physician to the team."
          }
          action={
            !search && selectedSpecialization === "all" && <AddPhysicianDialog />
          }
        />
      )}
    </div>
  );
}