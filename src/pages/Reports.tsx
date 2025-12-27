import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, Calendar, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api";

export default function Reports() {
  // Fetch real analytics data
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['analytics-stats'],
    queryFn: analyticsApi.getStats,
  });

  const { data: monthlyData = [], isLoading: monthlyLoading } = useQuery({
    queryKey: ['analytics-monthly'],
    queryFn: analyticsApi.getMonthlyTrends,
  });

  const { data: specialtyData = [], isLoading: specialtyLoading } = useQuery({
    queryKey: ['analytics-specialties'],
    queryFn: analyticsApi.getSpecialtyDistribution,
  });

  const { data: demographics, isLoading: demographicsLoading } = useQuery({
    queryKey: ['analytics-demographics'],
    queryFn: analyticsApi.getPatientDemographics,
  });

  // Transform stats for display
  const displayStats = stats ? [
    {
      title: "Total Patients",
      value: stats.totalPatients.toLocaleString(),
      icon: Users,
      change: `${stats.patientChangePercent >= 0 ? '+' : ''}${stats.patientChangePercent}%`
    },
    {
      title: "Appointments This Month",
      value: stats.appointmentsThisMonth.toString(),
      icon: Calendar,
      change: `${stats.appointmentChangePercent >= 0 ? '+' : ''}${stats.appointmentChangePercent}%`
    },
    {
      title: "Revenue",
      value: `$${stats.revenue.toLocaleString()}`,
      icon: DollarSign,
      change: `${stats.revenueChangePercent >= 0 ? '+' : ''}${stats.revenueChangePercent}%`
    },
    {
      title: "Active Physicians",
      value: stats.activePhysicians.toString(),
      icon: BarChart3,
      change: `${stats.physicianChangePercent >= 0 ? '+' : ''}${stats.physicianChangePercent}%`
    },
  ] : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-24"></div>
                    <div className="h-8 bg-muted rounded w-16"></div>
                  </div>
                  <div className="w-8 h-8 bg-muted rounded"></div>
                </div>
                <div className="h-6 bg-muted rounded w-20 mt-2"></div>
              </div>
            </Card>
          ))
        ) : (
          displayStats.map((stat) => (
            <Card key={stat.title} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className="w-8 h-8 text-muted-foreground" />
              </div>
              <Badge variant="secondary" className="mt-2">
                {stat.change} from last month
              </Badge>
            </Card>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Trends</h3>
          {monthlyLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-pulse text-muted-foreground">Loading trends...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="patients" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="appointments" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Trends</h3>
          {monthlyLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-pulse text-muted-foreground">Loading revenue data...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Specialty Distribution</h3>
          {specialtyLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-pulse text-muted-foreground">Loading specialty data...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={specialtyData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {specialtyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Patient Statistics</h3>
          {demographicsLoading ? (
            <div className="space-y-4">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-full mb-2"></div>
                <div className="h-2 bg-muted rounded w-full"></div>
              </div>
            </div>
          ) : demographics ? (
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Male Patients</span>
                <span className="font-semibold">
                  {Math.round((demographics.malePatients / (demographics.malePatients + demographics.femalePatients)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{
                    width: `${(demographics.malePatients / (demographics.malePatients + demographics.femalePatients)) * 100}%`
                  }}
                ></div>
              </div>
              <div className="flex justify-between">
                <span>Female Patients</span>
                <span className="font-semibold">
                  {Math.round((demographics.femalePatients / (demographics.malePatients + demographics.femalePatients)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-secondary h-2 rounded-full"
                  style={{
                    width: `${(demographics.femalePatients / (demographics.malePatients + demographics.femalePatients)) * 100}%`
                  }}
                ></div>
              </div>
              <div className="pt-4">
                <h4 className="font-medium mb-2">Age Groups</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>18-30</span>
                    <span>{demographics.ageGroups['18-30']}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>31-50</span>
                    <span>{demographics.ageGroups['31-50']}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>51-70</span>
                    <span>{demographics.ageGroups['51-70']}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>70+</span>
                    <span>{demographics.ageGroups['70+']}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No demographic data available
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}