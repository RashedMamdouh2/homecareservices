import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patientMedicalApi, DiseaseSearchResult } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Search, Loader2, Check } from "lucide-react";
import { format } from "date-fns";

interface AddDiagnosisDialogProps {
  patientId: number;
  trigger?: React.ReactNode;
}

export function AddDiagnosisDialog({ patientId, trigger }: AddDiagnosisDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DiseaseSearchResult[]>([]);
  const [selectedDisease, setSelectedDisease] = useState<DiseaseSearchResult | null>(null);
  const [diagnosisDate, setDiagnosisDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [recoveryDate, setRecoveryDate] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const queryClient = useQueryClient();

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await patientMedicalApi.searchDiseases(searchQuery);
        setSearchResults(results);
        setShowResults(true);
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const addDiagnosisMutation = useMutation({
    mutationFn: () =>
      patientMedicalApi.addDiagnosis(patientId, {
        patientId,
        icd: selectedDisease!.icd,
        diagnosisDate,
        recoverdDate: recoveryDate || undefined,
      }),
    onSuccess: () => {
      toast.success("Diagnosis added successfully");
      queryClient.invalidateQueries({ queryKey: ["patient-diseases", patientId] });
      resetForm();
      setOpen(false);
    },
    onError: () => {
      toast.error("Failed to add diagnosis");
    },
  });

  const resetForm = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedDisease(null);
    setDiagnosisDate(format(new Date(), "yyyy-MM-dd"));
    setRecoveryDate("");
    setShowResults(false);
  };

  const handleSelectDisease = (disease: DiseaseSearchResult) => {
    setSelectedDisease(disease);
    setSearchQuery(disease.name);
    setShowResults(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDisease) {
      toast.error("Please select a disease from the search results");
      return;
    }
    addDiagnosisMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Diagnosis
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Diagnosis</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Disease Search */}
          <div className="space-y-2">
            <Label htmlFor="disease-search">Disease Name</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="disease-search"
                placeholder="Type to search diseases..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedDisease(null);
                }}
                className="pl-9"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
              {selectedDisease && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
              )}
            </div>
            
            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute z-50 w-[calc(100%-3rem)] mt-1 bg-popover border border-border rounded-md shadow-lg max-h-[200px] overflow-auto">
                {searchResults.map((disease) => (
                  <button
                    key={disease.icd}
                    type="button"
                    className="w-full px-4 py-2 text-left hover:bg-accent transition-colors flex items-center justify-between"
                    onClick={() => handleSelectDisease(disease)}
                  >
                    <span className="text-sm font-medium">{disease.name}</span>
                    <span className="text-xs text-muted-foreground">ICD: {disease.icd}</span>
                  </button>
                ))}
              </div>
            )}
            
            {showResults && searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
              <p className="text-sm text-muted-foreground">No diseases found</p>
            )}
          </div>

          {/* Selected Disease Display */}
          {selectedDisease && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm font-medium text-primary">{selectedDisease.name}</p>
              <p className="text-xs text-muted-foreground">ICD Code: {selectedDisease.icd}</p>
            </div>
          )}

          {/* Diagnosis Date */}
          <div className="space-y-2">
            <Label htmlFor="diagnosis-date">Diagnosis Date</Label>
            <Input
              id="diagnosis-date"
              type="date"
              value={diagnosisDate}
              onChange={(e) => setDiagnosisDate(e.target.value)}
              required
            />
          </div>

          {/* Recovery Date (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="recovery-date">Recovery Date (Optional)</Label>
            <Input
              id="recovery-date"
              type="date"
              value={recoveryDate}
              onChange={(e) => setRecoveryDate(e.target.value)}
              min={diagnosisDate}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedDisease || addDiagnosisMutation.isPending}
            >
              {addDiagnosisMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Diagnosis"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
