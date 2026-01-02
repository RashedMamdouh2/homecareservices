import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, ArrowDownToLine, DollarSign, History } from "lucide-react";
import { getAuthHeaders } from "@/lib/api";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const API_BASE_URL = "https://homecareservice.runasp.net/api";

interface PhysicianEarnings {
  totalEarnings: number;
  availableBalance: number;
  pendingWithdrawals: number;
  completedAppointments: number;
  monthlyEarnings: number;
}

interface WithdrawRequest {
  physicianId: number;
  amount: number;
}

const fetchEarnings = async (physicianId: number): Promise<PhysicianEarnings> => {
  const response = await fetch(`${API_BASE_URL}/Physician/Earnings/${physicianId}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch earnings");
  return response.json();
};

const requestWithdrawal = async (data: WithdrawRequest): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/Physician/Withdraw/${data.physicianId}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ amount: data.amount }),
  });
  if (!response.ok) throw new Error("Failed to request withdrawal");
};

interface PhysicianEarningsProps {
  physicianId: number;
}

export function PhysicianEarnings({ physicianId }: PhysicianEarningsProps) {
  const queryClient = useQueryClient();

  const { data: earnings, isLoading } = useQuery({
    queryKey: ["physician-earnings", physicianId],
    queryFn: () => fetchEarnings(physicianId),
  });

  const withdrawMutation = useMutation({
    mutationFn: requestWithdrawal,
    onSuccess: () => {
      toast.success("Withdrawal request submitted successfully");
      queryClient.invalidateQueries({ queryKey: ["physician-earnings", physicianId] });
    },
    onError: () => {
      toast.error("Failed to submit withdrawal request");
    },
  });

  const handleWithdraw = () => {
    if (earnings && earnings.availableBalance > 0) {
      withdrawMutation.mutate({ physicianId, amount: earnings.availableBalance });
    }
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Wallet className="w-5 h-5" />
          My Earnings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Total Earnings</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              ${earnings?.totalEarnings?.toFixed(2) || "0.00"}
            </p>
          </div>
          
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Wallet className="w-4 h-4" />
              <span className="text-sm">Available</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              ${earnings?.availableBalance?.toFixed(2) || "0.00"}
            </p>
          </div>
          
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ArrowDownToLine className="w-4 h-4" />
              <span className="text-sm">Pending</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">
              ${earnings?.pendingWithdrawals?.toFixed(2) || "0.00"}
            </p>
          </div>
          
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">This Month</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              ${earnings?.monthlyEarnings?.toFixed(2) || "0.00"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div>
            <p className="text-sm text-muted-foreground">
              {earnings?.completedAppointments || 0} completed appointments
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild className="gap-2">
              <Link to="/withdrawal-history">
                <History className="w-4 h-4" />
                History
              </Link>
            </Button>
            <Button
              onClick={handleWithdraw}
              disabled={!earnings?.availableBalance || earnings.availableBalance <= 0 || withdrawMutation.isPending}
              className="gap-2"
            >
              <ArrowDownToLine className="w-4 h-4" />
              {withdrawMutation.isPending ? "Processing..." : "Withdraw Funds"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
