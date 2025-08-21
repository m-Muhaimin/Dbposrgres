import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRealtime } from "@/hooks/use-realtime";
import { useEffect, useState } from "react";
import type { LabResult, Patient } from "@shared/schema";

interface LabResultWithPatient extends LabResult {
  patientName?: string;
}

export function LabResultsTable() {
  const [labResults, setLabResults] = useState<LabResultWithPatient[]>([]);
  const { lastMessage } = useRealtime();

  const { data: fetchedLabs, isLoading } = useQuery<LabResult[]>({
    queryKey: ["/api/labs/recent"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  // Combine lab results with patient names
  useEffect(() => {
    if (fetchedLabs && patients) {
      const labsWithPatients = fetchedLabs.map(lab => {
        const patient = patients.find(p => p.id === lab.patientId);
        return {
          ...lab,
          patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Unknown Patient"
        };
      });
      setLabResults(labsWithPatients);
    }
  }, [fetchedLabs, patients]);

  // Handle real-time lab result updates
  useEffect(() => {
    if (lastMessage?.type === "lab_result" && lastMessage.data && patients) {
      const patient = patients.find(p => p.id === lastMessage.data.patientId);
      const newLabResult = {
        ...lastMessage.data,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Unknown Patient"
      };
      
      setLabResults(prevLabs => [newLabResult, ...prevLabs.slice(0, 9)]); // Keep only 10 most recent
    }
  }, [lastMessage, patients]);

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "normal": return "default";
      case "elevated": 
      case "low": return "secondary";
      case "critical": return "destructive";
      default: return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "normal": return "text-health-green";
      case "elevated": 
      case "low": return "text-caution-amber";
      case "critical": return "text-alert-red";
      default: return "text-gray-500";
    }
  };

  const formatTimeAgo = (date: Date | string | null) => {
    if (!date) return "Unknown";
    
    const now = new Date();
    const labDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - labDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hr ago`;
    return `${Math.floor(diffInMinutes / 1440)} day ago`;
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!labResults.length) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-dark-slate">Recent Lab Results</h2>
          <Button variant="link" className="text-medical-blue hover:text-blue-700" data-testid="button-view-all-results">
            View all results
          </Button>
        </div>
        <div className="text-center text-gray-500 py-8">
          No lab results available
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-dark-slate">Recent Lab Results</h2>
        <Button variant="link" className="text-medical-blue hover:text-blue-700" data-testid="button-view-all-results">
          View all results
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full" data-testid="lab-results-table">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Patient</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Test</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Result</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Reference</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Status</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {labResults.map((labResult) => (
              <tr key={labResult.id} data-testid={`lab-result-row-${labResult.id}`}>
                <td className="py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img 
                      src={`https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32&seed=${labResult.patientId}`}
                      alt={labResult.patientName}
                      className="w-8 h-8 rounded-full mr-3"
                    />
                    <span className="text-sm font-medium text-dark-slate" data-testid={`text-patient-name-${labResult.id}`}>
                      {labResult.patientName}
                    </span>
                  </div>
                </td>
                <td className="py-4 text-sm text-gray-600" data-testid={`text-test-name-${labResult.id}`}>
                  {labResult.testName}
                </td>
                <td className="py-4 text-sm font-medium text-dark-slate" data-testid={`text-result-${labResult.id}`}>
                  {labResult.result} {labResult.unit && <span className="text-gray-500">{labResult.unit}</span>}
                </td>
                <td className="py-4 text-sm text-gray-500" data-testid={`text-reference-${labResult.id}`}>
                  {labResult.referenceRange || "Not specified"}
                </td>
                <td className="py-4">
                  <Badge 
                    variant={getStatusVariant(labResult.status)} 
                    className={getStatusColor(labResult.status)}
                    data-testid={`badge-status-${labResult.id}`}
                  >
                    {labResult.status}
                  </Badge>
                </td>
                <td className="py-4 text-sm text-gray-500" data-testid={`text-timestamp-${labResult.id}`}>
                  {formatTimeAgo(labResult.completedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
