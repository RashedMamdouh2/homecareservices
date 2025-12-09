import { useQuery } from "@tanstack/react-query";
import { physiciansApi } from "@/lib/api";
import { PageHeader } from "@/components/common/PageHeader";
import { PhysicianCard } from "@/components/physicians/PhysicianCard";
import { PageLoader } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Stethoscope, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Physicians() {
  const [search, setSearch] = useState("");

  const { data: physicians, isLoading } = useQuery({
    queryKey: ["physicians"],
    queryFn: physiciansApi.getAll,
  });

  if (isLoading) {
    return <PageLoader />;
  }

  const filteredPhysicians = physicians?.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.specializationName.toLowerCase().includes(search.toLowerCase()) ||
      p.clinicalAddress.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Physicians"
        description="Our team of qualified healthcare professionals"
        action={
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Physician
          </Button>
        }
      />

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search physicians..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
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
              <PhysicianCard physician={physician} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Stethoscope}
          title={search ? "No physicians found" : "No physicians yet"}
          description={
            search
              ? "Try adjusting your search terms"
              : "Add your first physician to the team."
          }
          action={
            !search && (
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Physician
              </Button>
            )
          }
        />
      )}
    </div>
  );
}
