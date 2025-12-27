import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { physicianScheduleApi } from "@/lib/api";
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
import { Plus, Clock, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface AddAvailabilityDialogProps {
  physicianId: number;
}

export function AddAvailabilityDialog({ physicianId }: AddAvailabilityDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState("09:00");
  const [selectedDateTimes, setSelectedDateTimes] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: (dates: string[]) => physicianScheduleApi.addFreeAppointments(physicianId, dates),
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
    setTime("09:00");
    setSelectedDateTimes([]);
  };

  const handleAddDateTime = () => {
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    // Combine date and time into ISO format
    const dateTimeStr = `${format(selectedDate, "yyyy-MM-dd")}T${time}:00`;
    
    if (selectedDateTimes.includes(dateTimeStr)) {
      toast.error("This time slot is already added");
      return;
    }

    setSelectedDateTimes([...selectedDateTimes, dateTimeStr]);
  };

  const handleRemoveDateTime = (dateTime: string) => {
    setSelectedDateTimes(selectedDateTimes.filter((dt) => dt !== dateTime));
  };

  const handleSubmit = () => {
    if (selectedDateTimes.length === 0) {
      toast.error("Please add at least one time slot");
      return;
    }

    addMutation.mutate(selectedDateTimes);
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return format(date, "MMM d, yyyy h:mm a");
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
          <DialogTitle>Add Available Time Slots</DialogTitle>
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

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Time
            </Label>
            <div className="flex gap-2">
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={handleAddDateTime}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {selectedDateTimes.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Time Slots</Label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-muted/50 rounded-lg">
                {selectedDateTimes.map((dateTime) => (
                  <Badge
                    key={dateTime}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {formatDateTime(dateTime)}
                    <button
                      type="button"
                      onClick={() => handleRemoveDateTime(dateTime)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={addMutation.isPending || selectedDateTimes.length === 0}
          >
            {addMutation.isPending ? "Adding..." : `Add ${selectedDateTimes.length} Time Slot${selectedDateTimes.length !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}