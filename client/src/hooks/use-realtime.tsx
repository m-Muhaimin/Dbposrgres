import { useEffect, useRef, useState } from "react";
import { useToast } from "./use-toast";

export interface RealtimeMessage {
  type: "vitals_update" | "lab_result" | "alert" | "ai_insight" | "system_status" | "patient_update";
  data: any;
  timestamp: string;
  patientId?: string;
}

export function useRealtime() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<RealtimeMessage | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const connect = () => {
      try {
        setConnectionStatus("connecting");
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("WebSocket connected");
          setIsConnected(true);
          setConnectionStatus("connected");
          toast({
            title: "Real-time Connection",
            description: "Successfully connected to live data feed",
          });
        };

        ws.onmessage = (event) => {
          try {
            const message: RealtimeMessage = JSON.parse(event.data);
            setLastMessage(message);
            
            // Dispatch a custom event for other components to listen to
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('realtime-message', { detail: message }));
            }
            
            // Handle different message types
            switch (message.type) {
              case "alert":
                if (message.data.severity === "critical") {
                  toast({
                    title: "Critical Alert",
                    description: message.data.title,
                    variant: "destructive",
                  });
                }
                break;
              case "vitals_update":
                // Handle vital signs updates
                break;
              case "lab_result":
                if (message.data.status === "critical") {
                  toast({
                    title: "Critical Lab Result",
                    description: `${message.data.testName}: ${message.data.result}`,
                    variant: "destructive",
                  });
                }
                break;
              case "ai_insight":
                if (message.data.priority === "critical") {
                  toast({
                    title: "AI Alert",
                    description: message.data.title,
                  });
                }
                break;
              case "patient_update":
                // Patient data updated
                break;
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        ws.onclose = () => {
          console.log("WebSocket disconnected");
          setIsConnected(false);
          setConnectionStatus("disconnected");
          
          // Attempt to reconnect after 3 seconds
          setTimeout(connect, 3000);
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          setIsConnected(false);
          setConnectionStatus("disconnected");
        };
      } catch (error) {
        console.error("Failed to connect WebSocket:", error);
        setConnectionStatus("disconnected");
        // Retry connection after 5 seconds
        setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [toast]);

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  return {
    isConnected,
    connectionStatus,
    lastMessage,
    sendMessage
  };
}
