import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Stethoscope,
  Calendar,
  DollarSign,
  TrendingUp,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { AddPatientDialog } from "@/components/patients/AddPatientDialog";
import { EditPatientDialog } from "@/components/patients/EditPatientDialog";
import { AddPhysicianDialog } from "@/components/physicians/AddPhysicianDialog";
import { EditPhysicianDialog } from "@/components/physicians/EditPhysicianDialog";
import { BookAppointmentDialog } from "@/components/appointments/BookAppointmentDialog";
import { EditAppointmentDialog } from "@/components/appointments/EditAppointmentDialog";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { getAuthToken } from "@/contexts/AuthContext";

const API_BASE_URL = "https://homecareservice.runasp.net/api";

// Book Appointment Button Component
function BookAppointmentButton({ onBooked }: { onBooked: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Book Appointment
      </Button>
      <BookAppointmentDialog 
        open={open} 
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) onBooked();
        }} 
      />
    </>
  );
}

// API Functions
const fetchWithAuth = async (url: string) => {
  const token = getAuthToken();
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) throw new Error("Failed to fetch");
  return response.json();
};

const deleteWithAuth = async (url: string) => {
  const token = getAuthToken();
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("Failed to delete");
  return response;
};

// Colors for charts
const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "#10b981", "#f59e0b", "#ef4444"];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [patientSearch, setPatientSearch] = useState("");
  const [physicianSearch, setPhysicianSearch] = useState("");
  const [appointmentSearch, setAppointmentSearch] = useState("");
  
  // Dialog states
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: string; id: number | string | null }>({
    open: false,
    type: "",
    id: null,
  });
  const [editPatient, setEditPatient] = useState<any>(null);
  const [editPhysician, setEditPhysician] = useState<any>(null);
  const [editAppointment, setEditAppointment] = useState<any>(null);

  // Fetch all data
  const { data: patients = [], refetch: refetchPatients } = useQuery({
    queryKey: ["admin-patients"],
    queryFn: () => fetchWithAuth(`${API_BASE_URL}/Patient/GetAllPatients`),
  });

  const { data: physicians = [], refetch: refetchPhysicians } = useQuery({
    queryKey: ["admin-physicians"],
    queryFn: () => fetchWithAuth(`${API_BASE_URL}/Physician/GetAllPhysicians`),
  });

  const { data: appointments = [], refetch: refetchAppointments } = useQuery({
    queryKey: ["admin-appointments"],
    queryFn: () => fetchWithAuth(`${API_BASE_URL}/Appointments/GetAllAppointments`),
  });

  const { data: analytics } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => fetchWithAuth(`${API_BASE_URL}/Analytics/Dashboard`),
  });

  const { data: monthlyTrends = [] } = useQuery({
    queryKey: ["admin-monthly-trends"],
    queryFn: () => fetchWithAuth(`${API_BASE_URL}/Analytics/MonthlyTrends`),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: () => fetchWithAuth(`${API_BASE_URL}/Payment/GetAllPayments`),
  });

  // Filter functions
  const filteredPatients = patients.filter((p: any) =>
    p.name?.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.phone?.includes(patientSearch) ||
    p.city?.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const filteredPhysicians = physicians.filter((p: any) =>
    p.name?.toLowerCase().includes(physicianSearch.toLowerCase()) ||
    p.specialization?.name?.toLowerCase().includes(physicianSearch.toLowerCase())
  );

  const filteredAppointments = appointments.filter((a: any) =>
    a.patient?.name?.toLowerCase().includes(appointmentSearch.toLowerCase()) ||
    a.physician?.name?.toLowerCase().includes(appointmentSearch.toLowerCase())
  );

  // Delete handlers
  const handleDelete = async () => {
    try {
      const { type, id } = deleteDialog;
      let url = "";
      
      switch (type) {
        case "patient":
          url = `${API_BASE_URL}/Patient/${id}`;
          break;
        case "physician":
          url = `${API_BASE_URL}/Physician/${id}`;
          break;
        case "appointment":
          url = `${API_BASE_URL}/Appointments/${id}`;
          break;
      }
      
      await deleteWithAuth(url);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
      
      if (type === "patient") refetchPatients();
      if (type === "physician") refetchPhysicians();
      if (type === "appointment") refetchAppointments();
    } catch (error) {
      toast.error("Failed to delete");
    } finally {
      setDeleteDialog({ open: false, type: "", id: null });
    }
  };

  // Calculate stats
  const stats = {
    totalPatients: patients.length,
    totalPhysicians: physicians.length,
    totalAppointments: appointments.length,
    completedAppointments: appointments.filter((a: any) => a.status === 3).length,
    pendingAppointments: appointments.filter((a: any) => a.status === 1).length,
    totalRevenue: payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
    monthlyRevenue: payments
      .filter((p: any) => {
        const paymentDate = new Date(p.paymentDate);
        const now = new Date();
        return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
  };

  // Prepare chart data
  const appointmentStatusData = [
    { name: "Completed", value: stats.completedAppointments, color: "#10b981" },
    { name: "Pending", value: stats.pendingAppointments, color: "#f59e0b" },
    { name: "Cancelled", value: appointments.filter((a: any) => a.status === 2).length, color: "#ef4444" },
    { name: "Confirmed", value: appointments.filter((a: any) => a.status === 0).length, color: "#3b82f6" },
  ];

  const revenueByMonth = monthlyTrends.length > 0 ? monthlyTrends : [
    { month: "Jan", revenue: 0, appointments: 0 },
    { month: "Feb", revenue: 0, appointments: 0 },
    { month: "Mar", revenue: 0, appointments: 0 },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage patients, physicians, appointments, and view analytics</p>
        </div>
        <Button variant="outline" onClick={() => {
          refetchPatients();
          refetchPhysicians();
          refetchAppointments();
        }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="patients">Patients</TabsTrigger>
          <TabsTrigger value="physicians">Physicians</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Patients"
              value={stats.totalPatients}
              icon={<Users className="h-5 w-5" />}
              variant="primary"
            />
            <StatCard
              title="Total Physicians"
              value={stats.totalPhysicians}
              icon={<Stethoscope className="h-5 w-5" />}
              variant="secondary"
            />
            <StatCard
              title="Total Appointments"
              value={stats.totalAppointments}
              icon={<Calendar className="h-5 w-5" />}
              variant="accent"
            />
            <StatCard
              title="Total Revenue"
              value={`$${stats.totalRevenue.toLocaleString()}`}
              icon={<DollarSign className="h-5 w-5" />}
              variant="success"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Monthly Revenue & Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
                    <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }} 
                    />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} name="Revenue ($)" />
                    <Line yAxisId="right" type="monotone" dataKey="appointments" stroke="hsl(var(--secondary))" strokeWidth={2} name="Appointments" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Appointment Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={appointmentStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {appointmentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Patients Tab */}
        <TabsContent value="patients" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <AddPatientDialog />
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient: any) => (
                    <TableRow key={patient.id}>
                      <TableCell>{patient.id}</TableCell>
                      <TableCell className="font-medium">{patient.name}</TableCell>
                      <TableCell>{patient.phone}</TableCell>
                      <TableCell>{patient.gender}</TableCell>
                      <TableCell>{patient.city}</TableCell>
                      <TableCell>
                        <Badge variant={patient.subscriptionId === 2 ? "default" : patient.subscriptionId === 1 ? "secondary" : "outline"}>
                          {patient.subscriptionId === 2 ? "24/7 Care" : patient.subscriptionId === 1 ? "Premium" : "Free"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => navigate(`/patients/${patient.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setEditPatient(patient)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteDialog({ open: true, type: "patient", id: patient.id })}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Physicians Tab */}
        <TabsContent value="physicians" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search physicians..."
                value={physicianSearch}
                onChange={(e) => setPhysicianSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <AddPhysicianDialog />
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Clinical Address</TableHead>
                    <TableHead>Session Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPhysicians.map((physician: any) => (
                    <TableRow key={physician.id}>
                      <TableCell>{physician.id}</TableCell>
                      <TableCell className="font-medium">{physician.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{physician.specialization?.name || "N/A"}</Badge>
                      </TableCell>
                      <TableCell>{physician.clinicalAddress}</TableCell>
                      <TableCell>${physician.sessionPrice || 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => navigate(`/physicians/${physician.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setEditPhysician(physician)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteDialog({ open: true, type: "physician", id: physician.id })}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search appointments..."
                value={appointmentSearch}
                onChange={(e) => setAppointmentSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <BookAppointmentButton onBooked={refetchAppointments} />
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Physician</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((appointment: any) => (
                    <TableRow key={appointment.id}>
                      <TableCell>{new Date(appointment.appointmentDate).toLocaleDateString()}</TableCell>
                      <TableCell>{appointment.startTime} - {appointment.endTime}</TableCell>
                      <TableCell className="font-medium">{appointment.patient?.name || "N/A"}</TableCell>
                      <TableCell>{appointment.physician?.name || "N/A"}</TableCell>
                      <TableCell>{appointment.meetingAddress}</TableCell>
                      <TableCell>
                        <Badge variant={
                          appointment.status === 3 ? "default" :
                          appointment.status === 0 ? "secondary" :
                          appointment.status === 2 ? "destructive" : "outline"
                        }>
                          {appointment.status === 0 ? "Confirmed" :
                           appointment.status === 1 ? "Pending" :
                           appointment.status === 2 ? "Cancelled" :
                           appointment.status === 3 ? "Completed" : "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setEditAppointment(appointment)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteDialog({ open: true, type: "appointment", id: appointment.id })}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Revenue"
              value={`$${stats.totalRevenue.toLocaleString()}`}
              icon={<DollarSign className="h-5 w-5" />}
              variant="success"
            />
            <StatCard
              title="Monthly Revenue"
              value={`$${stats.monthlyRevenue.toLocaleString()}`}
              icon={<TrendingUp className="h-5 w-5" />}
              variant="primary"
            />
            <StatCard
              title="Total Payments"
              value={payments.length}
              icon={<DollarSign className="h-5 w-5" />}
              variant="secondary"
            />
            <StatCard
              title="Avg. Payment"
              value={`$${payments.length > 0 ? (stats.totalRevenue / payments.length).toFixed(2) : 0}`}
              icon={<TrendingUp className="h-5 w-5" />}
              variant="accent"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }} 
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Revenue ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.slice(0, 5).map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">${payment.amount}</TableCell>
                        <TableCell>
                          <Badge variant={payment.status === "completed" ? "default" : "secondary"}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{payment.paymentMethod}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        onConfirm={handleDelete}
        title={`Delete ${deleteDialog.type}`}
        description={`Are you sure you want to delete this ${deleteDialog.type}? This action cannot be undone.`}
      />

      {/* Edit Dialogs */}
      {editPatient && (
        <EditPatientDialog
          patient={editPatient}
          open={!!editPatient}
          onOpenChange={(open) => {
            if (!open) {
              setEditPatient(null);
              refetchPatients();
            }
          }}
        />
      )}

      {editPhysician && (
        <EditPhysicianDialog
          physician={editPhysician}
          open={!!editPhysician}
          onOpenChange={(open) => {
            if (!open) {
              setEditPhysician(null);
              refetchPhysicians();
            }
          }}
        />
      )}

      {editAppointment && (
        <EditAppointmentDialog
          appointment={editAppointment}
          open={!!editAppointment}
          onOpenChange={(open) => {
            if (!open) {
              setEditAppointment(null);
              refetchAppointments();
            }
          }}
        />
      )}
    </div>
  );
}
