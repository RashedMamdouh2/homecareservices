import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileDown, X } from "lucide-react";
import { MedicationDto, getAssetUrl } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

interface ViewReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  pdfUrl: string;
  medications?: MedicationDto[];
}

export function ViewReportDialog({
  open,
  onOpenChange,
  appointmentId,
  pdfUrl,
  medications = [],
}: ViewReportDialogProps) {
  const fullPdfUrl = getAssetUrl(pdfUrl);
  
  const downloadPdf = () => {
    if (!fullPdfUrl) return;
    const link = document.createElement("a");
    link.href = fullPdfUrl;
    link.download = `report-${appointmentId}.pdf`;
    link.target = "_blank";
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Appointment Report</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border border-border rounded-lg overflow-hidden bg-muted/30">
            <iframe
              src={fullPdfUrl || ""}
              className="w-full h-[60vh]"
              title="Report PDF"
            />
          </div>

          {medications.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Medications</h4>
              <div className="space-y-2">
                {medications.map((med, index) => (
                  <div key={index} className="p-3 border border-border rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{med.name}</span>
                      <span className="text-sm text-muted-foreground">
                        Dose: {med.dose} x {med.doseFrequency}/day
                      </span>
                    </div>
                    {med.description && (
                      <p className="text-sm text-muted-foreground mt-1">{med.description}</p>
                    )}
                    {med.usageTimes && med.usageTimes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {med.usageTimes.map((time) => (
                          <Badge key={time} variant="secondary" className="text-xs">
                            {time}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4 mr-2" /> Close
            </Button>
            <Button onClick={downloadPdf}>
              <FileDown className="w-4 h-4 mr-2" /> Download PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
