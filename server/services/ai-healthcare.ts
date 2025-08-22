import OpenAI from "openai";
import type { Patient, VitalSigns, LabResult } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

const openai = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export interface HealthcareInsight {
  type: "prediction" | "recommendation" | "analysis";
  title: string;
  content: string;
  confidence: number;
  priority: "low" | "medium" | "high" | "critical";
  patientId?: string;
  data?: any;
}

export interface PredictiveAnalysis {
  riskScore: number;
  timeframe: string;
  factors: string[];
  recommendations: string[];
}

export class AIHealthcareService {
  async analyzePatientData(
    patient: Patient,
    vitals: VitalSigns[],
    labs: LabResult[],
  ): Promise<HealthcareInsight> {
    try {
      const patientContext = this.buildPatientContext(patient, vitals, labs);

      const response = await openai.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `You are an AI healthcare analytics assistant. Analyze patient data and provide clinical insights in JSON format with keys: "type" (prediction/recommendation/analysis), "title", "content", "confidence" (0-1), "priority" (low/medium/high/critical), and "data" (additional structured info).`,
          },
          {
            role: "user",
            content: `Analyze this patient data and provide healthcare insights:\n\n${patientContext}`,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      return {
        type: result.type || "analysis",
        title: result.title || "Patient Analysis",
        content: result.content || "Analysis completed",
        confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
        priority: result.priority || "medium",
        patientId: patient.id,
        data: result.data,
      };
    } catch (error) {
      console.error("AI analysis error:", error);
      throw new Error(
        "Failed to analyze patient data: " + (error as Error).message,
      );
    }
  }

  async generatePredictiveAnalysis(
    patients: Patient[],
    allVitals: VitalSigns[],
    allLabs: LabResult[],
  ): Promise<PredictiveAnalysis> {
    try {
      const aggregatedData = this.buildAggregatedContext(
        patients,
        allVitals,
        allLabs,
      );

      const response = await openai.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `You are a predictive healthcare analytics AI. Analyze population health data and provide predictive insights in JSON format with keys: "riskScore" (0-100), "timeframe", "factors" (array), "recommendations" (array).`,
          },
          {
            role: "user",
            content: `Provide predictive analysis for this healthcare population:\n\n${aggregatedData}`,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 800,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      return {
        riskScore: Math.max(0, Math.min(100, result.riskScore || 50)),
        timeframe: result.timeframe || "24 hours",
        factors: Array.isArray(result.factors) ? result.factors : [],
        recommendations: Array.isArray(result.recommendations)
          ? result.recommendations
          : [],
      };
    } catch (error) {
      console.error("Predictive analysis error:", error);
      throw new Error(
        "Failed to generate predictive analysis: " + (error as Error).message,
      );
    }
  }

  async generateClinicalSummary(patientId: string, data: any): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "Generate a concise clinical summary based on the provided patient data. Focus on key findings, trends, and actionable insights.",
          },
          {
            role: "user",
            content: `Generate clinical summary for patient data: ${JSON.stringify(data, null, 2)}`,
          },
        ],
        max_tokens: 500,
      });

      return (
        response.choices[0].message.content || "Clinical summary unavailable"
      );
    } catch (error) {
      console.error("Clinical summary error:", error);
      throw new Error(
        "Failed to generate clinical summary: " + (error as Error).message,
      );
    }
  }

  private buildPatientContext(
    patient: Patient,
    vitals: VitalSigns[],
    labs: LabResult[],
  ): string {
    const latestVitals = vitals[vitals.length - 1];
    const recentLabs = labs.slice(-5);

    return `
Patient: ${patient.firstName} ${patient.lastName}
Age: ${this.calculateAge(patient.dateOfBirth)}
Gender: ${patient.gender}
Room: ${patient.room || "Not assigned"}
Admission: ${patient.admissionDate?.toISOString() || "Not admitted"}

Latest Vital Signs:
- Heart Rate: ${latestVitals?.heartRate || "N/A"} bpm
- Blood Pressure: ${latestVitals?.systolicBP || "N/A"}/${latestVitals?.diastolicBP || "N/A"} mmHg
- Temperature: ${latestVitals?.temperature || "N/A"}°F
- Respiratory Rate: ${latestVitals?.respiratoryRate || "N/A"} breaths/min
- Oxygen Saturation: ${latestVitals?.oxygenSaturation || "N/A"}%

Recent Lab Results:
${recentLabs.map((lab) => `- ${lab.testName}: ${lab.result} ${lab.unit || ""} (${lab.status})`).join("\n")}

Vital Signs Trend (last 24 hours):
${vitals
  .slice(-10)
  .map(
    (v) =>
      `${v.timestamp?.toISOString()}: HR ${v.heartRate}, BP ${v.systolicBP}/${v.diastolicBP}, SpO2 ${v.oxygenSaturation}%`,
  )
  .join("\n")}
    `.trim();
  }

  private buildAggregatedContext(
    patients: Patient[],
    vitals: VitalSigns[],
    labs: LabResult[],
  ): string {
    const totalPatients = patients.length;
    const activePatients = patients.filter((p) => p.status === "active").length;
    const avgHeartRate =
      vitals.reduce((sum, v) => sum + (v.heartRate || 0), 0) / vitals.length;
    const criticalLabs = labs.filter((l) => l.status === "critical").length;

    return `
Population Overview:
- Total Patients: ${totalPatients}
- Active Patients: ${activePatients}
- Average Heart Rate: ${avgHeartRate.toFixed(1)} bpm
- Critical Lab Results: ${criticalLabs}

Recent Trends:
- Vital signs collected: ${vitals.length} in last 24h
- Lab results pending: ${labs.filter((l) => !l.reviewedAt).length}
- Emergency admissions: ${patients.filter((p) => p.admissionDate && new Date(p.admissionDate) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
    `.trim();
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  }
}

export const aiHealthcareService = new AIHealthcareService();
