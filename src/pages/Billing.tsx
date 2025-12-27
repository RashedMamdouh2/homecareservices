import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { toast } from "sonner";
import { Plus, FileText } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentApi, InvoiceDto } from "@/lib/api";

export default function Billing() {
  const { user, isAdmin } = useAuth();
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showBillForm, setShowBillForm] = useState(false);
  const [billForm, setBillForm] = useState({
    patientId: '',
    amount: '',
    description: '',
    dueDate: ''
  });
  const queryClient = useQueryClient();

  // Fetch invoices
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: paymentApi.getInvoices,
  });

  // Fetch patients (for admin bill generation)
  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://homecareservice.runasp.net/api'}/patients`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch patients');
      return res.json();
    },
    enabled: isAdmin,
  });

  // Payment mutation
  const confirmPaymentMutation = useMutation({
    mutationFn: paymentApi.confirmPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success("Payment confirmed successfully!");
    },
    onError: (error) => {
      console.error('Payment confirmation error:', error);
      toast.error("Failed to confirm payment");
    },
  });

  // Generate bill mutation (admin only)
  const generateBillMutation = useMutation({
    mutationFn: paymentApi.generateBill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success("Bill generated successfully!");
    },
    onError: (error) => {
      console.error('Bill generation error:', error);
      toast.error("Failed to generate bill");
    },
  });

  const handlePayment = async (invoice: InvoiceDto) => {
    if (!stripe || !elements) {
      toast.error("Stripe not loaded");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast.error("Card element not found");
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment intent on backend
      const paymentIntent = await paymentApi.createPaymentIntent(invoice.Id);
      setClientSecret(paymentIntent.clientSecret);

      // Confirm payment with Stripe
      const { error, paymentIntent: confirmedPayment } = await stripe.confirmCardPayment(
        paymentIntent.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: user?.name || 'Patient',
              email: user?.email,
            },
          },
        }
      );

      if (error) {
        toast.error(error.message || "Payment failed");
        return;
      }

      if (confirmedPayment?.status === 'succeeded') {
        // Confirm payment on backend
        await confirmPaymentMutation.mutateAsync({
          paymentIntentId: confirmedPayment.id,
          status: confirmedPayment.status,
          amount: confirmedPayment.amount,
        });
      } else {
        toast.error("Payment was not successful");
      }

    } catch (error) {
      console.error('Payment error:', error);
      toast.error("Payment failed - please try again");
    } finally {
      setIsProcessing(false);
      setClientSecret(null);
    }
  };

  const handleGenerateBill = () => {
    if (!billForm.patientId || !billForm.amount || !billForm.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    const amount = parseFloat(billForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    generateBillMutation.mutate({
      patientId: parseInt(billForm.patientId),
      amount: amount,
      description: billForm.description,
      dueDate: billForm.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }, {
      onSuccess: () => {
        setShowBillForm(false);
        setBillForm({ patientId: '', amount: '', description: '', dueDate: '' });
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Billing & Payments" />

      {isAdmin && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Bill Generation</h3>
              <p className="text-muted-foreground">Generate bills for services provided</p>
            </div>
            <Button
              onClick={() => setShowBillForm(!showBillForm)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {showBillForm ? 'Cancel' : 'Generate Bill'}
            </Button>
          </div>

          {showBillForm && (
            <div className="space-y-4 border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patient">Patient *</Label>
                  <Select
                    value={billForm.patientId}
                    onValueChange={(value) => setBillForm(prev => ({ ...prev, patientId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient: any) => (
                        <SelectItem key={patient.id} value={patient.id.toString()}>
                          {patient.firstName} {patient.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">Amount ($) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={billForm.amount}
                    onChange={(e) => setBillForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="150.00"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={billForm.description}
                  onChange={(e) => setBillForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Service description"
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={billForm.dueDate}
                  onChange={(e) => setBillForm(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
              <Button
                onClick={handleGenerateBill}
                disabled={generateBillMutation.isPending}
                className="w-full"
              >
                {generateBillMutation.isPending ? "Generating Bill..." : "Create Bill"}
              </Button>
            </div>
          )}
        </Card>
      )}

      <div className="grid gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Invoices</h3>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading invoices...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No invoices found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div key={invoice.Id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{invoice.Description}</p>
                    <p className="text-sm text-muted-foreground">{invoice.InvoiceDate}</p>
                    {invoice.PatientName && (
                      <p className="text-sm text-muted-foreground">Patient: {invoice.PatientName}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">${invoice.Amount}</span>
                    <Badge variant={invoice.Status === 'paid' ? 'default' : invoice.Status === 'pending' ? 'secondary' : 'destructive'}>
                      {invoice.Status}
                    </Badge>
                    {invoice.Status === 'unpaid' && (
                      <Button
                        onClick={() => handlePayment(invoice)}
                        disabled={isProcessing || !stripe}
                        size="sm"
                      >
                        {isProcessing ? "Processing..." : "Pay Now"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}