import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Users, AlertTriangle, Heart, Clock } from "lucide-react";

interface DashboardStats {
  totalPatients: number;
  activePatients: number;
  criticalAlerts: number;
  pendingLabs: number;
  activeMonitoring: number;
}

export function PatientOverviewCards() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-16 bg-gray-200 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="text-center text-gray-500">
            Failed to load dashboard statistics
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <Card className="p-6 hover:shadow-lg transition-shadow duration-200" data-testid="card-total-patients">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Patients</p>
            <p className="text-2xl font-semibold text-dark-slate" data-testid="text-total-patients">
              {stats.totalPatients.toLocaleString()}
            </p>
            <p className="text-xs text-health-green mt-1">
              <span className="inline-block w-0 h-0 border-l-2 border-l-transparent border-r-2 border-r-transparent border-b-2 border-b-health-green mr-1"></span>
              +5.2% from last month
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
            <Users className="text-medical-blue h-6 w-6" />
          </div>
        </div>
      </Card>

      <Card className="p-6 hover:shadow-lg transition-shadow duration-200" data-testid="card-critical-alerts">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Critical Alerts</p>
            <p className="text-2xl font-semibold text-alert-red" data-testid="text-critical-alerts">
              {stats.criticalAlerts}
            </p>
            <p className="text-xs text-alert-red mt-1">
              <AlertTriangle className="inline h-3 w-3 mr-1" />
              Needs immediate attention
            </p>
          </div>
          <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
            <AlertTriangle className="text-alert-red h-6 w-6" />
          </div>
        </div>
      </Card>

      <Card className="p-6 hover:shadow-lg transition-shadow duration-200" data-testid="card-active-monitoring">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Active Monitoring</p>
            <p className="text-2xl font-semibold text-health-green" data-testid="text-active-monitoring">
              {stats.activeMonitoring}
            </p>
            <p className="text-xs text-health-green mt-1">
              <Heart className="inline h-3 w-3 mr-1" />
              Real-time vitals
            </p>
          </div>
          <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
            <Heart className="text-health-green h-6 w-6" />
          </div>
        </div>
      </Card>

      <Card className="p-6 hover:shadow-lg transition-shadow duration-200" data-testid="card-pending-labs">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Pending Lab Results</p>
            <p className="text-2xl font-semibold text-caution-amber" data-testid="text-pending-labs">
              {stats.pendingLabs}
            </p>
            <p className="text-xs text-caution-amber mt-1">
              <Clock className="inline h-3 w-3 mr-1" />
              Awaiting review
            </p>
          </div>
          <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
            <Clock className="text-caution-amber h-6 w-6" />
          </div>
        </div>
      </Card>
    </div>
  );
}
