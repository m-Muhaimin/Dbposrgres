import { Hospital, Users, BarChart3, FileText, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRealtime } from "@/hooks/use-realtime";

interface NavigationProps {
  currentPath?: string;
}

export function Navigation({ currentPath = "/" }: NavigationProps) {
  const { isConnected, connectionStatus } = useRealtime();

  const navItems = [
    { href: "/", label: "Dashboard", icon: BarChart3 },
    { href: "/patients", label: "Patients", icon: Users },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/reports", label: "Reports", icon: FileText },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Hospital className="h-8 w-8 text-medical-blue mr-3" />
              <h1 className="text-xl font-semibold text-dark-slate">HealthCare EHR</h1>
            </div>
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.href;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
                      isActive
                        ? "text-medical-blue bg-blue-50 border border-blue-200"
                        : "text-gray-600 hover:text-medical-blue hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </a>
                );
              })}
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
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">Dr. Sarah Wilson</p>
                <p className="text-xs text-gray-600">Chief Medical Officer</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}