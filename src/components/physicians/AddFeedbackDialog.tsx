import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Star } from "lucide-react";
import { toast } from "sonner";

interface AddFeedbackDialogProps {
  physicianId: number;
}

export function AddFeedbackDialog({ physicianId }: AddFeedbackDialogProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [rate, setRate] = useState(0);
  const [hoverRate, setHoverRate] = useState(0);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const addMutation = useMutation({
    mutationFn: () => {
      console.log("Current user from auth context:", user);
      if (!user?.patientId) {
        throw new Error("User patient ID not found");
      }
      if (!user?.name) {
        throw new Error("User name not found");
      }
      return physicianScheduleApi.addFeedback(physicianId, {
        description: description,
        rate,
        patientId: user.patientId,
        physicianId: physicianId,
        patientName: user.name,
      });
    },
    onSuccess: () => {
      toast.success("Feedback submitted successfully");
      queryClient.invalidateQueries({ queryKey: ["physician-feedbacks", physicianId] });
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error("Feedback submission error:", error);
      if (error.message?.includes("404") || error.message?.includes("Not Found")) {
        toast.error("Feedback feature is temporarily unavailable. Please contact support.");
      } else {
        toast.error(error.message || "Failed to submit feedback");
      }
    },
  });

  const resetForm = () => {
    setDescription("");
    setRate(0);
    setHoverRate(0);
  };

  const handleSubmit = () => {
    if (rate === 0) {
      toast.error("Please select a rating");
      return;
    }
    if (!description.trim()) {
      toast.error("Please enter your feedback");
      return;
    }
    if (!user?.patientId) {
      toast.error("Unable to submit feedback. Please log in as a patient.");
      return;
    }
    if (!user?.name) {
      toast.error("Unable to submit feedback. User information is incomplete.");
      return;
    }

    addMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <MessageSquare className="w-4 h-4 mr-2" />
          Leave Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex items-center justify-center gap-1 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRate(star)}
                  onMouseEnter={() => setHoverRate(star)}
                  onMouseLeave={() => setHoverRate(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoverRate || rate)
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rate > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {rate === 1 && "Poor"}
                {rate === 2 && "Fair"}
                {rate === 3 && "Good"}
                {rate === 4 && "Very Good"}
                {rate === 5 && "Excellent"}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">Your Feedback</Label>
            <Textarea
              id="feedback"
              placeholder="Share your experience with this physician..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={addMutation.isPending || rate === 0 || !description.trim() || !user?.patientId || !user?.name}
          >
            {addMutation.isPending ? "Submitting..." : "Submit Feedback"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}