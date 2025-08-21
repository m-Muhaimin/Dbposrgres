import { PatientOverviewCards } from "@/components/dashboard/patient-overview-cards";
import { PatientMonitoring } from "@/components/dashboard/patient-monitoring";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";
import { LabResultsTable } from "@/components/dashboard/lab-results-table";
import { AIHealthcareAgent } from "@/components/dashboard/ai-healthcare-agent";
import { ClinicalForecasting } from "@/components/dashboard/clinical-forecasting";
import { SystemStatus } from "@/components/dashboard/system-status";
import { useRealtime } from "@/hooks/use-realtime";
import { Badge } from "@/components/ui/badge";
import { Hospital, Bell } from "lucide-react";

export default function Dashboard() {
  const { isConnected, connectionStatus } = useRealtime();

  return (
    <div className="min-h-screen bg-clinical-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Hospital className="h-8 w-8 text-medical-blue mr-3" />
                <h1 className="text-xl font-semibold text-dark-slate">HealthCare EHR</h1>
              </div>
              <div className="hidden md:flex items-center space-x-1">
                <button className="px-3 py-2 rounded-md text-sm font-medium text-medical-blue bg-blue-50 border border-blue-200">
                  Dashboard
                </button>
                <button className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-medical-blue hover:bg-gray-50">
                  Patients
                </button>
                <button className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-medical-blue hover:bg-gray-50">
                  Analytics
                </button>
                <button className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-medical-blue hover:bg-gray-50">
                  Reports
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-health-green animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-sm text-gray-600">
                  {connectionStatus === "connected" ? "Real-time sync active" : "Connecting..."}
                </span>
              </div>
              <button className="relative p-2 text-gray-400 hover:text-medical-blue" data-testid="button-notifications">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-alert-red rounded-full"></span>
              </button>
              <div className="flex items-center space-x-2">
                <img 
                  src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=64&h=64" 
                  alt="Doctor profile" 
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm font-medium text-dark-slate">Dr. Sarah Chen</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Dashboard Area */}
          <div className="lg:col-span-3 space-y-6">
            <PatientOverviewCards />
            <PatientMonitoring />
            <AnalyticsCharts />
            <LabResultsTable />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <AIHealthcareAgent />
            <ClinicalForecasting />
            <SystemStatus />
          </div>
        </div>
      </div>
    </div>
  );
}
