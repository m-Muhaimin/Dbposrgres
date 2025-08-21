import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import type { VitalSigns } from "@shared/schema";

export function AnalyticsCharts() {
  const { data: vitals, isLoading } = useQuery<VitalSigns[]>({
    queryKey: ["/api/vitals/recent"],
    refetchInterval: 60000, // Refresh every minute
  });

  // Process vital signs data for charts
  const processVitalTrends = (vitals: VitalSigns[] | undefined) => {
    if (!vitals || vitals.length === 0) return [];

    // Group by hour and calculate averages
    const hourlyData = vitals.reduce((acc, vital) => {
      const hour = new Date(vital.timestamp || Date.now()).getHours();
      const key = `${hour}:00`;
      
      if (!acc[key]) {
        acc[key] = {
          time: key,
          heartRates: [],
          systolicBPs: [],
          count: 0
        };
      }
      
      if (vital.heartRate) acc[key].heartRates.push(vital.heartRate);
      if (vital.systolicBP) acc[key].systolicBPs.push(vital.systolicBP);
      acc[key].count++;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(hourlyData).map((data: any) => ({
      time: data.time,
      avgHeartRate: data.heartRates.length > 0 
        ? Math.round(data.heartRates.reduce((sum: number, rate: number) => sum + rate, 0) / data.heartRates.length)
        : 0,
      avgSystolicBP: data.systolicBPs.length > 0
        ? Math.round(data.systolicBPs.reduce((sum: number, bp: number) => sum + bp, 0) / data.systolicBPs.length)
        : 0,
      count: data.count
    })).sort((a, b) => parseInt(a.time) - parseInt(b.time));
  };

  // Mock admission data for demonstration
  const admissionData = [
    { day: 'Mon', admissions: 23, discharges: 18 },
    { day: 'Tue', admissions: 19, discharges: 22 },
    { day: 'Wed', admissions: 31, discharges: 28 },
    { day: 'Thu', admissions: 27, discharges: 24 },
    { day: 'Fri', admissions: 22, discharges: 25 },
    { day: 'Sat', admissions: 18, discharges: 20 },
    { day: 'Sun', admissions: 15, discharges: 17 },
  ];

  const vitalTrendsData = processVitalTrends(vitals);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6" data-testid="card-vital-trends">
        <h3 className="text-lg font-semibold text-dark-slate mb-4">Patient Vital Trends</h3>
        <div className="h-64 w-full">
          {vitalTrendsData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vitalTrendsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="time" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avgHeartRate"
                  stroke="#0066CC"
                  strokeWidth={2}
                  dot={{ fill: '#0066CC', strokeWidth: 2, r: 4 }}
                  name="Avg Heart Rate (bpm)"
                />
                <Line
                  type="monotone"
                  dataKey="avgSystolicBP"
                  stroke="#00A86B"
                  strokeWidth={2}
                  dot={{ fill: '#00A86B', strokeWidth: 2, r: 4 }}
                  name="Avg Systolic BP (mmHg)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p>No vital signs data available</p>
                <p className="text-sm">Real-time data will appear here</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6" data-testid="card-admission-rates">
        <h3 className="text-lg font-semibold text-dark-slate mb-4">Admission Rates</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={admissionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="day" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Legend />
              <Bar dataKey="admissions" fill="#0066CC" name="Admissions" radius={[2, 2, 0, 0]} />
              <Bar dataKey="discharges" fill="#00A86B" name="Discharges" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
