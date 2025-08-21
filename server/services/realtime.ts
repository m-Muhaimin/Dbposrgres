import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { VitalSigns, LabResult, Alert } from "@shared/schema";

export interface RealtimeMessage {
  type: "vitals_update" | "lab_result" | "alert" | "ai_insight" | "system_status";
  data: any;
  timestamp: string;
  patientId?: string;
}

export class RealtimeService {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setupWebSocketServer();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket connection established');
      this.clients.add(ws);

      ws.on('close', () => {
        console.log('WebSocket connection closed');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });

      // Send initial connection confirmation
      this.sendToClient(ws, {
        type: "system_status",
        data: { status: "connected", message: "Real-time connection established" },
        timestamp: new Date().toISOString()
      });
    });
  }

  broadcastVitalSigns(vitals: VitalSigns) {
    this.broadcast({
      type: "vitals_update",
      data: vitals,
      timestamp: new Date().toISOString(),
      patientId: vitals.patientId
    });
  }

  broadcastLabResult(labResult: LabResult) {
    this.broadcast({
      type: "lab_result",
      data: labResult,
      timestamp: new Date().toISOString(),
      patientId: labResult.patientId
    });
  }

  broadcastAlert(alert: Alert) {
    this.broadcast({
      type: "alert",
      data: alert,
      timestamp: new Date().toISOString(),
      patientId: alert.patientId
    });
  }

  broadcastAIInsight(insight: any) {
    this.broadcast({
      type: "ai_insight",
      data: insight,
      timestamp: new Date().toISOString(),
      patientId: insight.patientId
    });
  }

  broadcastSystemStatus(status: any) {
    this.broadcast({
      type: "system_status",
      data: status,
      timestamp: new Date().toISOString()
    });
  }

  private broadcast(message: RealtimeMessage) {
    const messageString = JSON.stringify(message);
    
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageString);
      }
    });
  }

  private sendToClient(client: WebSocket, message: RealtimeMessage) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  getActiveConnections(): number {
    return this.clients.size;
  }
}

export let realtimeService: RealtimeService;

export function initializeRealtimeService(server: Server) {
  realtimeService = new RealtimeService(server);
  return realtimeService;
}
