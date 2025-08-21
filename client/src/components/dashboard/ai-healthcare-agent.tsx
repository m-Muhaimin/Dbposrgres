import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Bot, TrendingUp, FileText, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRealtime } from "@/hooks/use-realtime";
import { useEffect, useState as useReactState } from "react";

interface AIMessage {
  id: string;
  type: "ai" | "system";
  content: string;
  timestamp: Date;
  priority?: "low" | "medium" | "high" | "critical";
}

export function AIHealthcareAgent() {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: "welcome",
      type: "ai",
      content: "Good morning, Dr. Chen. I'm analyzing real-time patient data and will provide updates on high-priority cases requiring attention.",
      timestamp: new Date(),
    }
  ]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const { lastMessage } = useRealtime();

  // Handle real-time AI insights
  useEffect(() => {
    if (lastMessage?.type === "ai_insight" && lastMessage.data) {
      const newMessage: AIMessage = {
        id: Date.now().toString(),
        type: "ai",
        content: lastMessage.data.content,
        timestamp: new Date(),
        priority: lastMessage.data.priority
      };
      setMessages(prev => [...prev, newMessage]);
    }
  }, [lastMessage]);

  const { data: patients } = useQuery({
    queryKey: ["/api/patients"],
  });

  const predictiveAnalysisMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/ai/predictive-analysis"),
    onSuccess: async (response) => {
      const data = await response.json();
      const newMessage: AIMessage = {
        id: Date.now().toString(),
        type: "ai",
        content: `Predictive Analysis Complete: Risk score ${data.riskScore}/100 for next ${data.timeframe}. Key factors: ${data.factors.join(", ")}. Recommendations: ${data.recommendations.join(", ")}`,
        timestamp: new Date(),
        priority: data.riskScore > 70 ? "high" : "medium"
      };
      setMessages(prev => [...prev, newMessage]);
      setIsAnalyzing(false);
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: "Unable to complete predictive analysis",
        variant: "destructive",
      });
      setIsAnalyzing(false);
    }
  });

  const patientAnalysisMutation = useMutation({
    mutationFn: (patientId: string) => apiRequest("POST", `/api/ai/analyze-patient/${patientId}`),
    onSuccess: async (response) => {
      const data = await response.json();
      const newMessage: AIMessage = {
        id: Date.now().toString(),
        type: "ai",
        content: `Patient Analysis: ${data.title} - ${data.content}`,
        timestamp: new Date(),
        priority: data.priority
      };
      setMessages(prev => [...prev, newMessage]);
      
      if (data.priority === "critical") {
        toast({
          title: "Critical AI Alert",
          description: data.title,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze patient data",
        variant: "destructive",
      });
    }
  });

  const clinicalSummaryMutation = useMutation({
    mutationFn: (patientId: string) => apiRequest("POST", `/api/ai/clinical-summary/${patientId}`),
    onSuccess: async (response) => {
      const data = await response.json();
      const newMessage: AIMessage = {
        id: Date.now().toString(),
        type: "ai",
        content: `Clinical Summary Generated: ${data.summary}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
    },
    onError: (error) => {
      toast({
        title: "Summary Failed",
        description: "Unable to generate clinical summary",
        variant: "destructive",
      });
    }
  });

  const handleRequestAnalysis = () => {
    setIsAnalyzing(true);
    predictiveAnalysisMutation.mutate();
  };

  const handleAnalyzePatient = () => {
    if (patients && patients.length > 0) {
      // Analyze the first patient as an example
      patientAnalysisMutation.mutate(patients[0].id);
    } else {
      toast({
        title: "No Patients",
        description: "No patients available for analysis",
        variant: "destructive",
      });
    }
  };

  const handleGenerateReport = () => {
    if (patients && patients.length > 0) {
      // Generate summary for the first patient as an example
      clinicalSummaryMutation.mutate(patients[0].id);
    } else {
      toast({
        title: "No Patients",
        description: "No patients available for summary",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "critical": return "border-l-alert-red";
      case "high": return "border-l-caution-amber";
      case "medium": return "border-l-medical-blue";
      default: return "border-l-gray-300";
    }
  };

  return (
    <Card className="p-6 h-fit" data-testid="ai-healthcare-agent">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-medical-blue rounded-lg flex items-center justify-center">
          <Bot className="text-white h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-dark-slate">AI Healthcare Agent</h3>
          <p className="text-xs text-gray-500">Powered by predictive analytics</p>
        </div>
        <div className="ml-auto">
          <div className="w-2 h-2 bg-health-green rounded-full animate-pulse" />
        </div>
      </div>

      {/* Chat Interface */}
      <div className="space-y-4 max-h-96 overflow-y-auto mb-4" data-testid="ai-chat-messages">
        {messages.map((message) => (
          <div key={message.id} className="flex items-start space-x-2">
            <div className="w-8 h-8 bg-medical-blue rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="text-white h-4 w-4" />
            </div>
            <div className={`bg-blue-50 rounded-lg p-3 max-w-[80%] border-l-4 ${getPriorityColor(message.priority)}`}>
              <p className="text-sm text-dark-slate" data-testid={`ai-message-${message.id}`}>
                {message.content}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {(isAnalyzing || predictiveAnalysisMutation.isPending || patientAnalysisMutation.isPending || clinicalSummaryMutation.isPending) && (
          <div className="flex justify-center">
            <div className="flex items-center space-x-2 text-gray-400">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <span className="text-xs">AI is analyzing real-time data...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="border-t border-gray-200 pt-4">
        <p className="text-xs text-gray-500 mb-3">Quick Actions</p>
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-sm text-medical-blue hover:bg-blue-50 p-2 h-auto"
            onClick={handleRequestAnalysis}
            disabled={predictiveAnalysisMutation.isPending}
            data-testid="button-request-analysis"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Request predictive analysis
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-sm text-medical-blue hover:bg-blue-50 p-2 h-auto"
            onClick={handleGenerateReport}
            disabled={clinicalSummaryMutation.isPending}
            data-testid="button-generate-report"
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate clinical summary
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-sm text-medical-blue hover:bg-blue-50 p-2 h-auto"
            onClick={handleAnalyzePatient}
            disabled={patientAnalysisMutation.isPending}
            data-testid="button-analyze-patient"
          >
            <Bell className="h-4 w-4 mr-2" />
            Analyze patient data
          </Button>
        </div>
      </div>
    </Card>
  );
}
