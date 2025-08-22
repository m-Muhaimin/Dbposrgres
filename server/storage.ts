import { 
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
import { randomUUID } from "crypto";

export interface IStorage {
  // Patient operations
  getPatient(id: string): Promise<Patient | undefined>;
  getPatients(): Promise<Patient[]>;
  getActivePatients(): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: string, updates: Partial<Patient>): Promise<Patient>;

  // Vital signs operations
  getVitalSigns(patientId: string): Promise<VitalSigns[]>;
  getLatestVitals(patientId: string): Promise<VitalSigns | undefined>;
  getAllRecentVitals(): Promise<VitalSigns[]>;
  createVitalSigns(vitals: InsertVitalSigns): Promise<VitalSigns>;

  // Lab results operations
  getLabResults(patientId: string): Promise<LabResult[]>;
  getRecentLabResults(): Promise<LabResult[]>;
  getPendingLabResults(): Promise<LabResult[]>;
  createLabResult(labResult: InsertLabResult): Promise<LabResult>;
  updateLabResult(id: string, updates: Partial<LabResult>): Promise<LabResult>;

  // Alerts operations
  getActiveAlerts(): Promise<Alert[]>;
  getPatientAlerts(patientId: string): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  acknowledgeAlert(id: string, acknowledgedBy: string): Promise<Alert>;

  // AI insights operations
  getAIInsights(): Promise<AiInsight[]>;
  getPatientAIInsights(patientId: string): Promise<AiInsight[]>;
  createAIInsight(insight: InsertAiInsight): Promise<AiInsight>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    totalPatients: number;
    activePatients: number;
    criticalAlerts: number;
    pendingLabs: number;
    activeMonitoring: number;
  }>;
}

export class MemStorage implements IStorage {
  private patients: Map<string, Patient> = new Map();
  private vitalSigns: Map<string, VitalSigns> = new Map();
  private labResults: Map<string, LabResult> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private aiInsights: Map<string, AiInsight> = new Map();

  constructor() {
    this.initializeTestData();
  }

  private initializeTestData() {
    // Create sample patients
    const patients: Patient[] = [
      {
        id: "patient-1",
        firstName: "Emily",
        lastName: "Johnson",
        dateOfBirth: new Date("1985-03-15"),
        gender: "Female",
        room: "204A",
        admissionDate: new Date("2024-08-20"),
        status: "active",
        medicalRecordNumber: "MRN001",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "patient-2", 
        firstName: "Robert",
        lastName: "Martinez",
        dateOfBirth: new Date("1978-11-22"),
        gender: "Male",
        room: "301B",
        admissionDate: new Date("2024-08-19"),
        status: "active",
        medicalRecordNumber: "MRN002",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "patient-3",
        firstName: "Michael",
        lastName: "Thompson",
        dateOfBirth: new Date("1965-07-08"),
        gender: "Male", 
        room: "ICU-5",
        admissionDate: new Date("2024-08-18"),
        status: "active",
        medicalRecordNumber: "MRN003",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    patients.forEach(patient => this.patients.set(patient.id, patient));

    // Create sample vital signs
    const vitals: VitalSigns[] = [
      {
        id: "vitals-1",
        patientId: "patient-1",
        heartRate: 78,
        systolicBP: 120,
        diastolicBP: 80,
        temperature: "98.6",
        respiratoryRate: 16,
        oxygenSaturation: 98,
        timestamp: new Date(),
        recordedBy: "Nurse Johnson"
      },
      {
        id: "vitals-2",
        patientId: "patient-2", 
        heartRate: 102,
        systolicBP: 140,
        diastolicBP: 95,
        temperature: "99.8",
        respiratoryRate: 18,
        oxygenSaturation: 96,
        timestamp: new Date(),
        recordedBy: "Nurse Smith"
      },
      {
        id: "vitals-3",
        patientId: "patient-3",
        heartRate: 125,
        systolicBP: 160,
        diastolicBP: 110,
        temperature: "101.2",
        respiratoryRate: 22,
        oxygenSaturation: 89,
        timestamp: new Date(),
        recordedBy: "ICU Staff"
      }
    ];

    vitals.forEach(vital => this.vitalSigns.set(vital.id, vital));

    // Create sample alerts
    const alerts: Alert[] = [
      {
        id: "alert-1",
        patientId: "patient-3",
        type: "vital",
        severity: "critical",
        title: "Critical Vital Signs",
        description: "Heart rate elevated (125 bpm), SpO2 below critical threshold (89%)",
        isActive: true,
        acknowledgedBy: null,
        acknowledgedAt: null,
        createdAt: new Date()
      },
      {
        id: "alert-2",
        patientId: "patient-2",
        type: "vital",
        severity: "high",
        title: "Elevated Blood Pressure",
        description: "Blood pressure reading 140/95 mmHg",
        isActive: true,
        acknowledgedBy: null,
        acknowledgedAt: null,
        createdAt: new Date()
      }
    ];

    alerts.forEach(alert => this.alerts.set(alert.id, alert));
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async getPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values());
  }

  async getActivePatients(): Promise<Patient[]> {
    return Array.from(this.patients.values()).filter(p => p.status === "active");
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = randomUUID();
    const patient: Patient = {
      ...insertPatient,
      id,
      room: insertPatient.room || null,
      admissionDate: insertPatient.admissionDate || null,
      status: insertPatient.status || "active",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.patients.set(id, patient);
    return patient;
  }

  async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient> {
    const patient = this.patients.get(id);
    if (!patient) throw new Error("Patient not found");
    
    const updated = { ...patient, ...updates, updatedAt: new Date() };
    this.patients.set(id, updated);
    return updated;
  }

  async getVitalSigns(patientId: string): Promise<VitalSigns[]> {
    return Array.from(this.vitalSigns.values()).filter(v => v.patientId === patientId);
  }

  async getLatestVitals(patientId: string): Promise<VitalSigns | undefined> {
    const vitals = await this.getVitalSigns(patientId);
    return vitals.sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))[0];
  }

  async getAllRecentVitals(): Promise<VitalSigns[]> {
    return Array.from(this.vitalSigns.values())
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
  }

  async createVitalSigns(insertVitals: InsertVitalSigns): Promise<VitalSigns> {
    const id = randomUUID();
    const vitals: VitalSigns = {
      ...insertVitals,
      id,
      heartRate: insertVitals.heartRate || null,
      systolicBP: insertVitals.systolicBP || null,
      diastolicBP: insertVitals.diastolicBP || null,
      temperature: insertVitals.temperature || null,
      respiratoryRate: insertVitals.respiratoryRate || null,
      oxygenSaturation: insertVitals.oxygenSaturation || null,
      recordedBy: insertVitals.recordedBy || null,
      timestamp: new Date()
    };
    this.vitalSigns.set(id, vitals);
    return vitals;
  }

  async getLabResults(patientId: string): Promise<LabResult[]> {
    return Array.from(this.labResults.values()).filter(l => l.patientId === patientId);
  }

  async getRecentLabResults(): Promise<LabResult[]> {
    return Array.from(this.labResults.values())
      .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0))
      .slice(0, 10);
  }

  async getPendingLabResults(): Promise<LabResult[]> {
    return Array.from(this.labResults.values()).filter(l => !l.reviewedAt);
  }

  async createLabResult(insertLabResult: InsertLabResult): Promise<LabResult> {
    const id = randomUUID();
    const labResult: LabResult = {
      ...insertLabResult,
      id,
      unit: insertLabResult.unit || null,
      referenceRange: insertLabResult.referenceRange || null,
      orderedBy: insertLabResult.orderedBy || null,
      reviewedBy: insertLabResult.reviewedBy || null,
      reviewedAt: insertLabResult.reviewedAt || null,
      completedAt: new Date()
    };
    this.labResults.set(id, labResult);
    return labResult;
  }

  async updateLabResult(id: string, updates: Partial<LabResult>): Promise<LabResult> {
    const labResult = this.labResults.get(id);
    if (!labResult) throw new Error("Lab result not found");
    
    const updated = { ...labResult, ...updates };
    this.labResults.set(id, updated);
    return updated;
  }

  async getActiveAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values()).filter(a => a.isActive);
  }

  async getPatientAlerts(patientId: string): Promise<Alert[]> {
    return Array.from(this.alerts.values()).filter(a => a.patientId === patientId && a.isActive);
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const id = randomUUID();
    const alert: Alert = {
      ...insertAlert,
      id,
      isActive: insertAlert.isActive ?? true,
      acknowledgedBy: insertAlert.acknowledgedBy || null,
      acknowledgedAt: insertAlert.acknowledgedAt || null,
      createdAt: new Date()
    };
    this.alerts.set(id, alert);
    return alert;
  }

  async acknowledgeAlert(id: string, acknowledgedBy: string): Promise<Alert> {
    const alert = this.alerts.get(id);
    if (!alert) throw new Error("Alert not found");
    
    const updated = {
      ...alert,
      acknowledgedBy,
      acknowledgedAt: new Date(),
      isActive: false
    };
    this.alerts.set(id, updated);
    return updated;
  }

  async getAIInsights(): Promise<AiInsight[]> {
    return Array.from(this.aiInsights.values());
  }

  async getPatientAIInsights(patientId: string): Promise<AiInsight[]> {
    return Array.from(this.aiInsights.values()).filter(i => i.patientId === patientId);
  }

  async createAIInsight(insertInsight: InsertAiInsight): Promise<AiInsight> {
    const id = randomUUID();
    const insight: AiInsight = {
      ...insertInsight,
      id,
      patientId: insertInsight.patientId || null,
      confidence: insertInsight.confidence || null,
      data: insertInsight.data || null,
      expiresAt: insertInsight.expiresAt || null,
      createdAt: new Date()
    };
    this.aiInsights.set(id, insight);
    return insight;
  }

  async getDashboardStats() {
    const patients = await this.getPatients();
    const activePatients = await this.getActivePatients();
    const activeAlerts = await this.getActiveAlerts();
    const pendingLabs = await this.getPendingLabResults();
    
    return {
      totalPatients: patients.length,
      activePatients: activePatients.length,
      criticalAlerts: activeAlerts.filter(a => a.severity === "critical").length,
      pendingLabs: pendingLabs.length,
      activeMonitoring: activePatients.length // Assuming all active patients are being monitored
    };
  }
}

import { DatabaseStorage } from "./db-storage";

// Use database storage for production, memory storage for development if needed
export const storage = new DatabaseStorage();
