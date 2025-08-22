import type { Express } from "express";
import multer from "multer";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertPatientSchema, 
  insertVitalSignsSchema, 
  insertLabResultSchema,
  insertAlertSchema,
  insertAiInsightSchema
} from "@shared/schema";
import { aiHealthcareService } from "./services/ai-healthcare";
import { initializeRealtimeService } from "./services/realtime";
import { parseCsvFile, parseSqlFile, type ImportResult } from "./bulk-import";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize real-time service
  const realtimeService = initializeRealtimeService(httpServer);

  // Configure multer for file uploads
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Patients
  app.get("/api/patients", async (req, res) => {
    try {
      const patients = await storage.getActivePatients();
      res.json(patients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch patients" });
    }
  });

  app.get("/api/patients/:id", async (req, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch patient" });
    }
  });

  app.post("/api/patients", async (req, res) => {
    try {
      console.log("Received patient data:", req.body);
      
      // Transform date strings to Date objects
      const patientData = {
        ...req.body,
        dateOfBirth: new Date(req.body.dateOfBirth),
        admissionDate: req.body.admissionDate ? new Date(req.body.admissionDate) : null
      };
      
      const validatedData = insertPatientSchema.parse(patientData);
      console.log("Validated patient data:", validatedData);
      
      const patient = await storage.createPatient(validatedData);
      console.log("Created patient:", patient);
      
      // Broadcast real-time update
      realtimeService.broadcastPatientUpdate(patient);
      
      res.status(201).json(patient);
    } catch (error) {
      console.error("Patient creation error:", error);
      res.status(400).json({ 
        error: "Invalid patient data",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.put("/api/patients/:id", async (req, res) => {
    try {
      // Transform date strings to Date objects
      const patientData = {
        ...req.body,
        dateOfBirth: new Date(req.body.dateOfBirth),
        admissionDate: req.body.admissionDate ? new Date(req.body.admissionDate) : null
      };
      
      const validatedData = insertPatientSchema.parse(patientData);
      const patient = await storage.updatePatient(req.params.id, validatedData);
      
      // Broadcast real-time update
      realtimeService.broadcastPatientUpdate(patient);
      
      res.json(patient);
    } catch (error) {
      console.error("Patient update error:", error);
      res.status(400).json({ 
        error: "Failed to update patient",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/patients/bulk-import", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fileExtension = '.' + req.file.originalname.split('.').pop()?.toLowerCase();
      let parseResult;

      if (fileExtension === '.csv') {
        parseResult = await parseCsvFile(req.file.buffer);
      } else if (fileExtension === '.sql') {
        const fileContent = req.file.buffer.toString('utf-8');
        parseResult = parseSqlFile(fileContent);
      } else {
        return res.status(400).json({ error: "Unsupported file type. Only CSV and SQL files are allowed." });
      }

      const { patients, errors } = parseResult;
      let imported = 0;
      let failed = 0;
      const importErrors: string[] = [...errors];

      // Import each patient
      for (const patientData of patients) {
        try {
          const patient = await storage.createPatient(patientData);
          imported++;
          
          // Broadcast real-time update for each patient
          realtimeService.broadcastPatientUpdate(patient);
        } catch (error) {
          failed++;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          importErrors.push(`Failed to import patient ${patientData.firstName} ${patientData.lastName}: ${errorMsg}`);
        }
      }

      const result: ImportResult = {
        imported,
        failed,
        errors: importErrors
      };

      if (imported === 0) {
        return res.status(400).json({ 
          error: "No patients were imported", 
          ...result 
        });
      }

      res.json(result);
    } catch (error) {
      console.error("Bulk import error:", error);
      res.status(500).json({ 
        error: "Bulk import failed",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.delete("/api/patients/:id", async (req, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      
      // Mark as discharged instead of deleting
      const updatedPatient = await storage.updatePatient(req.params.id, { status: "discharged" });
      
      // Broadcast real-time update
      realtimeService.broadcastPatientUpdate(updatedPatient);
      
      res.json({ message: "Patient marked as discharged" });
    } catch (error) {
      res.status(500).json({ error: "Failed to discharge patient" });
    }
  });

  // Vital Signs
  app.get("/api/patients/:id/vitals", async (req, res) => {
    try {
      const vitals = await storage.getVitalSigns(req.params.id);
      res.json(vitals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vital signs" });
    }
  });

  app.get("/api/vitals/recent", async (req, res) => {
    try {
      const vitals = await storage.getAllRecentVitals();
      res.json(vitals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent vitals" });
    }
  });

  app.post("/api/patients/:id/vitals", async (req, res) => {
    try {
      const validatedData = insertVitalSignsSchema.parse({
        ...req.body,
        patientId: req.params.id
      });
      const vitals = await storage.createVitalSigns(validatedData);
      
      // Broadcast real-time update
      realtimeService.broadcastVitalSigns(vitals);
      
      res.status(201).json(vitals);
    } catch (error) {
      res.status(400).json({ error: "Invalid vital signs data" });
    }
  });

  // Lab Results
  app.get("/api/patients/:id/labs", async (req, res) => {
    try {
      const labs = await storage.getLabResults(req.params.id);
      res.json(labs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lab results" });
    }
  });

  app.get("/api/labs/recent", async (req, res) => {
    try {
      const labs = await storage.getRecentLabResults();
      res.json(labs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent lab results" });
    }
  });

  app.post("/api/patients/:id/labs", async (req, res) => {
    try {
      const validatedData = insertLabResultSchema.parse({
        ...req.body,
        patientId: req.params.id
      });
      const labResult = await storage.createLabResult(validatedData);
      
      // Broadcast real-time update
      realtimeService.broadcastLabResult(labResult);
      
      res.status(201).json(labResult);
    } catch (error) {
      res.status(400).json({ error: "Invalid lab result data" });
    }
  });

  // Alerts
  app.get("/api/alerts", async (req, res) => {
    try {
      const alerts = await storage.getActiveAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  app.post("/api/alerts", async (req, res) => {
    try {
      const validatedData = insertAlertSchema.parse(req.body);
      const alert = await storage.createAlert(validatedData);
      
      // Broadcast real-time update
      realtimeService.broadcastAlert(alert);
      
      res.status(201).json(alert);
    } catch (error) {
      res.status(400).json({ error: "Invalid alert data" });
    }
  });

  app.patch("/api/alerts/:id/acknowledge", async (req, res) => {
    try {
      const { acknowledgedBy } = req.body;
      if (!acknowledgedBy) {
        return res.status(400).json({ error: "acknowledgedBy is required" });
      }
      
      const alert = await storage.acknowledgeAlert(req.params.id, acknowledgedBy);
      
      // Broadcast real-time update
      realtimeService.broadcastAlert(alert);
      
      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: "Failed to acknowledge alert" });
    }
  });

  // AI Healthcare Agent
  app.post("/api/ai/analyze-patient/:id", async (req, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }

      const vitals = await storage.getVitalSigns(req.params.id);
      const labs = await storage.getLabResults(req.params.id);

      const insight = await aiHealthcareService.analyzePatientData(patient, vitals, labs);
      
      // Store AI insight
      await storage.createAIInsight({
        patientId: patient.id,
        type: insight.type,
        title: insight.title,
        content: insight.content,
        confidence: insight.confidence.toString(),
        data: insight.data
      });

      // Broadcast real-time update
      realtimeService.broadcastAIInsight(insight);
      
      res.json(insight);
    } catch (error) {
      res.status(500).json({ error: "Failed to analyze patient data: " + (error as Error).message });
    }
  });

  app.post("/api/ai/predictive-analysis", async (req, res) => {
    try {
      const patients = await storage.getActivePatients();
      const allVitals = await storage.getAllRecentVitals();
      const allLabs = await storage.getRecentLabResults();

      const analysis = await aiHealthcareService.generatePredictiveAnalysis(patients, allVitals, allLabs);
      
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate predictive analysis: " + (error as Error).message });
    }
  });

  app.post("/api/ai/clinical-summary/:id", async (req, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }

      const vitals = await storage.getVitalSigns(req.params.id);
      const labs = await storage.getLabResults(req.params.id);
      const alerts = await storage.getPatientAlerts(req.params.id);

      const data = { patient, vitals, labs, alerts };
      const summary = await aiHealthcareService.generateClinicalSummary(req.params.id, data);
      
      res.json({ summary });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate clinical summary: " + (error as Error).message });
    }
  });

  // WebSocket status
  app.get("/api/realtime/status", (req, res) => {
    res.json({
      activeConnections: realtimeService.getActiveConnections(),
      status: "active"
    });
  });

  return httpServer;
}
