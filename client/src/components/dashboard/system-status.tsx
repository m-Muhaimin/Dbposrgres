import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRealtime } from "@/hooks/use-realtime";
import { Database, Wifi, Brain, Activity } from "lucide-react";

interface SystemStatus {
  activeConnections: number;
  status: string;
}

export function SystemStatus() {
  const { isConnected, connectionStatus } = useRealtime();
  
  const { data: realtimeStatus } = useQuery<SystemStatus>({
    queryKey: ["/api/realtime/status"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const getStatusIcon = (status: "connected" | "connecting" | "disconnected") => {
    const iconClass = "h-3 w-3";
    switch (status) {
      case "connected": return <div className={`${iconClass} bg-health-green rounded-full`} />;
      case "connecting": return <div className={`${iconClass} bg-caution-amber rounded-full animate-pulse`} />;
      case "disconnected": return <div className={`${iconClass} bg-alert-red rounded-full`} />;
    }
  };

  const getStatusText = (status: "connected" | "connecting" | "disconnected") => {
    switch (status) {
      case "connected": return "Online";
      case "connecting": return "Connecting";
      case "disconnected": return "Offline";
    }
  };

  const getStatusColor = (status: "connected" | "connecting" | "disconnected") => {
    switch (status) {
      case "connected": return "text-health-green";
      case "connecting": return "text-caution-amber";
      case "disconnected": return "text-alert-red";
    }
  };

  // Mock system load calculation
  const systemLoad = realtimeStatus?.activeConnections 
    ? realtimeStatus.activeConnections > 5 ? "High" : "Normal"
    : "Unknown";
  
  const systemLoadStatus = systemLoad === "High" ? "connecting" : "connected";

  return (
    <Card className="p-6" data-testid="system-status">
      <h3 className="font-semibold text-dark-slate mb-4">System Status</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between" data-testid="status-database">
          <div className="flex items-center space-x-2">
            {getStatusIcon("connected")}
            <Database className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">Database Connection</span>
          </div>
          <span className={`text-xs font-medium ${getStatusColor("connected")}`}>
            {getStatusText("connected")}
          </span>
        </div>

        <div className="flex items-center justify-between" data-testid="status-realtime-sync">
          <div className="flex items-center space-x-2">
            {getStatusIcon(connectionStatus)}
            <Wifi className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">Real-time Sync</span>
          </div>
          <span className={`text-xs font-medium ${getStatusColor(connectionStatus)}`}>
            {getStatusText(connectionStatus)}
          </span>
        </div>

        <div className="flex items-center justify-between" data-testid="status-ai-analytics">
          <div className="flex items-center space-x-2">
            {getStatusIcon("connected")}
            <Brain className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">AI Analytics</span>
          </div>
          <span className={`text-xs font-medium ${getStatusColor("connected")}`}>
            Processing
          </span>
        </div>

        <div className="flex items-center justify-between" data-testid="status-system-load">
          <div className="flex items-center space-x-2">
            {getStatusIcon(systemLoadStatus)}
            <Activity className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">System Load</span>
          </div>
          <span className={`text-xs font-medium ${getStatusColor(systemLoadStatus)}`}>
            {systemLoad}
          </span>
        </div>
      </div>

      {/* Connection Details */}
      {realtimeStatus && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <p>Active connections: {realtimeStatus.activeConnections}</p>
            <p>WebSocket status: {isConnected ? "Connected" : "Disconnected"}</p>
            <p>Last update: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      )}
    </Card>
  );
}
