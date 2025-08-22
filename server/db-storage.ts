import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc, and, isNull } from "drizzle-orm";
import {
  patients,
  vitalSigns,
  labResults,
  alerts,
  aiInsights,
  type Patient,
  type InsertPatient,
  type VitalSigns,
  type InsertVitalSigns,
  type LabResult,
  type InsertLabResult,
  type Alert,
  type InsertAlert,
  type AiInsight,
  type InsertAiInsight
} from "@shared/schema";
import type { IStorage } from "./storage";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export class DatabaseStorage implements IStorage {
  // Patient operations
  async getPatient(id: string): Promise<Patient | undefined> {
    const result = await db.select().from(patients).where(eq(patients.id, id)).limit(1);
    return result[0];
  }

  async getPatients(): Promise<Patient[]> {
    return await db.select().from(patients);
  }

  async getActivePatients(): Promise<Patient[]> {
    return await db.select().from(patients).where(eq(patients.status, "active"));
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    const result = await db.insert(patients).values(patient).returning();
    return result[0];
  }

  async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient> {
    const result = await db
      .update(patients)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(patients.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error("Patient not found");
    }
    
    return result[0];
  }

  // Vital signs operations
  async getVitalSigns(patientId: string): Promise<VitalSigns[]> {
    return await db
      .select()
      .from(vitalSigns)
      .where(eq(vitalSigns.patientId, patientId))
      .orderBy(desc(vitalSigns.timestamp));
  }

  async getLatestVitals(patientId: string): Promise<VitalSigns | undefined> {
    const result = await db
      .select()
      .from(vitalSigns)
      .where(eq(vitalSigns.patientId, patientId))
      .orderBy(desc(vitalSigns.timestamp))
      .limit(1);
    return result[0];
  }

  async getAllRecentVitals(): Promise<VitalSigns[]> {
    return await db
      .select()
      .from(vitalSigns)
      .orderBy(desc(vitalSigns.timestamp))
      .limit(100);
  }

  async createVitalSigns(vitals: InsertVitalSigns): Promise<VitalSigns> {
    const result = await db.insert(vitalSigns).values(vitals).returning();
    return result[0];
  }

  // Lab results operations
  async getLabResults(patientId: string): Promise<LabResult[]> {
    return await db
      .select()
      .from(labResults)
      .where(eq(labResults.patientId, patientId))
      .orderBy(desc(labResults.completedAt));
  }

  async getRecentLabResults(): Promise<LabResult[]> {
    return await db
      .select()
      .from(labResults)
      .orderBy(desc(labResults.completedAt))
      .limit(50);
  }

  async getPendingLabResults(): Promise<LabResult[]> {
    return await db
      .select()
      .from(labResults)
      .where(isNull(labResults.reviewedAt));
  }

  async createLabResult(labResult: InsertLabResult): Promise<LabResult> {
    const result = await db.insert(labResults).values(labResult).returning();
    return result[0];
  }

  async updateLabResult(id: string, updates: Partial<LabResult>): Promise<LabResult> {
    const result = await db
      .update(labResults)
      .set(updates)
      .where(eq(labResults.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error("Lab result not found");
    }
    
    return result[0];
  }

  // Alerts operations
  async getActiveAlerts(): Promise<Alert[]> {
    return await db
      .select()
      .from(alerts)
      .where(eq(alerts.isActive, true))
      .orderBy(desc(alerts.createdAt));
  }

  async getPatientAlerts(patientId: string): Promise<Alert[]> {
    return await db
      .select()
      .from(alerts)
      .where(and(eq(alerts.patientId, patientId), eq(alerts.isActive, true)))
      .orderBy(desc(alerts.createdAt));
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const result = await db.insert(alerts).values(alert).returning();
    return result[0];
  }

  async acknowledgeAlert(id: string, acknowledgedBy: string): Promise<Alert> {
    const result = await db
      .update(alerts)
      .set({
        acknowledgedBy,
        acknowledgedAt: new Date(),
        isActive: false
      })
      .where(eq(alerts.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error("Alert not found");
    }
    
    return result[0];
  }

  // AI insights operations
  async getAIInsights(): Promise<AiInsight[]> {
    return await db
      .select()
      .from(aiInsights)
      .orderBy(desc(aiInsights.createdAt))
      .limit(100);
  }

  async getPatientAIInsights(patientId: string): Promise<AiInsight[]> {
    return await db
      .select()
      .from(aiInsights)
      .where(eq(aiInsights.patientId, patientId))
      .orderBy(desc(aiInsights.createdAt));
  }

  async createAIInsight(insight: InsertAiInsight): Promise<AiInsight> {
    const result = await db.insert(aiInsights).values(insight).returning();
    return result[0];
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    totalPatients: number;
    activePatients: number;
    criticalAlerts: number;
    pendingLabs: number;
    activeMonitoring: number;
  }> {
    const [totalPatients, activePatients, criticalAlerts, pendingLabs] = await Promise.all([
      db.select({ count: patients.id }).from(patients),
      db.select({ count: patients.id }).from(patients).where(eq(patients.status, "active")),
      db.select({ count: alerts.id }).from(alerts).where(and(eq(alerts.isActive, true), eq(alerts.severity, "critical"))),
      db.select({ count: labResults.id }).from(labResults).where(isNull(labResults.reviewedAt))
    ]);

    return {
      totalPatients: totalPatients.length,
      activePatients: activePatients.length,
      criticalAlerts: criticalAlerts.length,
      pendingLabs: pendingLabs.length,
      activeMonitoring: activePatients.length
    };
  }
}