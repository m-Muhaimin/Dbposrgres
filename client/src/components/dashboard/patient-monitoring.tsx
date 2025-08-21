import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRealtime } from "@/hooks/use-realtime";
import { useEffect, useState } from "react";
import type { Patient, VitalSigns } from "@shared/schema";

interface PatientWithVitals {
  patient: Patient;
  vitals: VitalSigns | null;
}

export function PatientMonitoring() {
  const [patients, setPatients] = useState<PatientWithVitals[]>([]);
  const { lastMessage } = useRealtime();

  const { data: fetchedPatients, isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: recentVitals } = useQuery<VitalSigns[]>({
    queryKey: ["/api/vitals/recent"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Combine patients with their latest vitals
  useEffect(() => {
    if (fetchedPatients && recentVitals) {
      const combined = fetchedPatients.map(patient => {
        const vitals = recentVitals.find(v => v.patientId === patient.id) || null;
        return { patient, vitals };
      });
      setPatients(combined);
    }
  }, [fetchedPatients, recentVitals]);

  // Handle real-time vital sign updates
  useEffect(() => {
    if (lastMessage?.type === "vitals_update" && lastMessage.data) {
      setPatients(prevPatients => 
        prevPatients.map(item => 
          item.patient.id === lastMessage.data.patientId
            ? { ...item, vitals: lastMessage.data }
            : item
        )
      );
    }
  }, [lastMessage]);

  const getVitalStatus = (vitals: VitalSigns | null) => {
    if (!vitals) return "unknown";
    
    const { heartRate, oxygenSaturation, systolicBP } = vitals;
    
    // Critical thresholds
    if (
      (heartRate && heartRate > 120) || 
      (oxygenSaturation && oxygenSaturation < 90) ||
      (systolicBP && systolicBP > 180)
    ) {
      return "critical";
    }
    
    // Warning thresholds
    if (
      (heartRate && (heartRate > 100 || heartRate < 60)) ||
      (oxygenSaturation && oxygenSaturation < 95) ||
      (systolicBP && systolicBP > 140)
    ) {
      return "warning";
    }
    
    return "normal";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical": return "bg-red-50 border-red-200";
      case "warning": return "bg-yellow-50 border-yellow-200";
      case "normal": return "border-gray-200";
      default: return "border-gray-200";
    }
  };

  const getIndicatorColor = (status: string) => {
    switch (status) {
      case "critical": return "bg-alert-red";
      case "warning": return "bg-caution-amber";
      case "normal": return "bg-health-green";
      default: return "bg-gray-400";
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!patients.length) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-dark-slate mb-6">Real-time Patient Monitoring</h2>
        <div className="text-center text-gray-500 py-8">
          No active patients found for monitoring
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-dark-slate">Real-time Patient Monitoring</h2>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-health-green rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Live data feed</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="patient-monitoring-grid">
        {patients.map(({ patient, vitals }) => {
          const status = getVitalStatus(vitals);
          return (
            <div 
              key={patient.id}
              className={`border rounded-lg p-4 hover:shadow-md transition-shadow duration-200 ${getStatusColor(status)}`}
              data-testid={`patient-card-${patient.id}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <img 
                    src={`https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=48&h=48&seed=${patient.id}`}
                    alt={`${patient.firstName} ${patient.lastName}`}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-dark-slate" data-testid={`text-patient-name-${patient.id}`}>
                      {patient.firstName} {patient.lastName}
                    </p>
                    <p className="text-xs text-gray-500" data-testid={`text-patient-room-${patient.id}`}>
                      {patient.room || "No room assigned"}
                    </p>
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${getIndicatorColor(status)}`} />
              </div>
              
              {vitals ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Heart Rate</span>
                    <span className={`font-medium ${status === 'critical' && vitals.heartRate && vitals.heartRate > 120 ? 'text-alert-red' : ''}`}>
                      {vitals.heartRate || "N/A"} bpm
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Blood Pressure</span>
                    <span className="font-medium">
                      {vitals.systolicBP || "N/A"}/{vitals.diastolicBP || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Temperature</span>
                    <span className="font-medium">{vitals.temperature || "N/A"}°F</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">SpO2</span>
                    <span className={`font-medium ${status === 'critical' && vitals.oxygenSaturation && vitals.oxygenSaturation < 90 ? 'text-alert-red' : ''}`}>
                      {vitals.oxygenSaturation || "N/A"}%
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <p className="text-sm">No vital signs recorded</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
