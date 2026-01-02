import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { getAuthHeaders } from "@/lib/api";

const API_BASE_URL = "https://homecareservice.runasp.net/api";

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "completed";
  requestedAt: string;
  processedAt?: string;
  notes?: string;
}

const fetchWithdrawalHistory = async (physicianId: number): Promise<WithdrawalRequest[]> => {
  const response = await fetch(
    `${API_BASE_URL}/Physician/WithdrawalHistory/${physicianId}`,
    { headers: getAuthHeaders() }
  );
  if (!response.ok) throw new Error("Failed to fetch withdrawal history");
  return response.json();
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case "approved":
      return <AlertCircle className="h-4 w-4 text-blue-500" />;
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "rejected":
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Pending</Badge>;
    case "approved":
      return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">Approved</Badge>;
    case "completed":
      return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">Completed</Badge>;
    case "rejected":
      return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">Rejected</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const WithdrawalHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const physicianId = user?.physicianId;

  const { data: withdrawals, isLoading, error } = useQuery({
    queryKey: ["withdrawal-history", physicianId],
    queryFn: () => fetchWithdrawalHistory(physicianId!),
    enabled: !!physicianId,
  });

  if (!physicianId) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Access Denied</h3>
          <p className="text-muted-foreground">This page is only accessible to physicians.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Withdrawal History</h1>
          <p className="text-muted-foreground">View all your past withdrawal requests</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Withdrawals</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold">Error Loading History</h3>
              <p className="text-muted-foreground">Failed to load withdrawal history. Please try again.</p>
            </div>
          ) : !withdrawals || withdrawals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No Withdrawals Yet</h3>
              <p className="text-muted-foreground">You haven't made any withdrawal requests yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date Requested</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Processed Date</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell>
                      {format(new Date(withdrawal.requestedAt), "MMM dd, yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${withdrawal.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(withdrawal.status)}
                        {getStatusBadge(withdrawal.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {withdrawal.processedAt
                        ? format(new Date(withdrawal.processedAt), "MMM dd, yyyy HH:mm")
                        : "-"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {withdrawal.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WithdrawalHistory;
