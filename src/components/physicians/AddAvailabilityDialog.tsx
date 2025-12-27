import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { physicianScheduleApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, Clock } from "lucide-react";
import { toast } from "sonner";

interface AddAvailabilityDialogProps {
  physicianId: number;
}

export function AddAvailabilityDialog({ physicianId }: AddAvailabilityDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: physicianScheduleApi.addAvailability,
    onSuccess: () => {
      toast.success("Availability added successfully");
      queryClient.invalidateQueries({ queryKey: ["physician-free-slots"] });
      setOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error("Failed to add availability");
    },
  });

  const resetForm = () => {
    setSelectedDate(new Date());
    setStartTime("09:00");
    setEndTime("17:00");
  };

  const handleSubmit = () => {
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    addMutation.mutate({
      physicianId,
      date: format(selectedDate, "yyyy-MM-dd"),
      startTime: `${startTime}:00`,
      endTime: `${endTime}:00`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Availability
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Available Time Slot</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Select Date</Label>
            <div className="flex justify-center mt-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                className="rounded-md border"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Start Time
              </Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                End Time
              </Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={addMutation.isPending}
          >
            {addMutation.isPending ? "Adding..." : "Add Availability"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
