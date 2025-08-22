import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  gender: text("gender").notNull(),
  room: text("room"),
  admissionDate: timestamp("admission_date"),
  status: text("status").notNull().default("active"), // active, discharged, transferred
  medicalRecordNumber: text("medical_record_number").notNull().unique(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const vitalSigns = pgTable("vital_signs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  heartRate: integer("heart_rate"), // bpm
  systolicBP: integer("systolic_bp"), // mmHg
  diastolicBP: integer("diastolic_bp"), // mmHg
  temperature: decimal("temperature", { precision: 4, scale: 1 }), // Fahrenheit
  respiratoryRate: integer("respiratory_rate"), // breaths per minute
  oxygenSaturation: integer("oxygen_saturation"), // percentage
  timestamp: timestamp("timestamp").default(sql`CURRENT_TIMESTAMP`),
  recordedBy: text("recorded_by"),
});

export const labResults = pgTable("lab_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  testName: text("test_name").notNull(),
  result: text("result").notNull(),
  unit: text("unit"),
  referenceRange: text("reference_range"),
  status: text("status").notNull(), // normal, elevated, critical, low
  orderedBy: text("ordered_by"),
  completedAt: timestamp("completed_at").default(sql`CURRENT_TIMESTAMP`),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
});

export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  type: text("type").notNull(), // vital, lab, medication, system
  severity: text("severity").notNull(), // low, medium, high, critical
  title: text("title").notNull(),
  description: text("description").notNull(),
  isActive: boolean("is_active").default(true),
  acknowledgedBy: text("acknowledged_by"),
  acknowledgedAt: timestamp("acknowledged_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const aiInsights = pgTable("ai_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id),
  type: text("type").notNull(), // prediction, recommendation, analysis
  title: text("title").notNull(),
  content: text("content").notNull(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }), // 0.00 to 1.00
  data: jsonb("data"), // Additional structured data
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  expiresAt: timestamp("expires_at"),
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dateOfBirth: z.union([z.string(), z.date()]).transform((val) => {
    if (typeof val === 'string') return new Date(val);
    return val;
  }),
  admissionDate: z.union([z.string(), z.date(), z.null()]).transform((val) => {
    if (typeof val === 'string') return new Date(val);
    return val;
  }).optional().nullable(),
});

export const insertVitalSignsSchema = createInsertSchema(vitalSigns).omit({
  id: true,
  timestamp: true,
});

export const insertLabResultSchema = createInsertSchema(labResults).omit({
  id: true,
  completedAt: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
});

export const insertAiInsightSchema = createInsertSchema(aiInsights).omit({
  id: true,
  createdAt: true,
});

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type VitalSigns = typeof vitalSigns.$inferSelect;
export type InsertVitalSigns = z.infer<typeof insertVitalSignsSchema>;
export type LabResult = typeof labResults.$inferSelect;
export type InsertLabResult = z.infer<typeof insertLabResultSchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type AiInsight = typeof aiInsights.$inferSelect;
export type InsertAiInsight = z.infer<typeof insertAiInsightSchema>;
