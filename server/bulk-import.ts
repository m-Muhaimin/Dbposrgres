import { Readable } from 'stream';
import csv from 'csv-parser';
import type { InsertPatient } from '@shared/schema';
import { insertPatientSchema } from '@shared/schema';

export interface ImportResult {
  imported: number;
  failed: number;
  errors: string[];
}

export async function parseCsvFile(fileBuffer: Buffer): Promise<{ patients: InsertPatient[], errors: string[] }> {
  const patients: InsertPatient[] = [];
  const errors: string[] = [];
  
  return new Promise((resolve) => {
    const stream = Readable.from(fileBuffer);
    let rowIndex = 0;
    
    stream
      .pipe(csv())
      .on('data', (row) => {
        rowIndex++;
        try {
          // Transform the CSV row to match our patient schema
          const patientData = {
            firstName: row.firstName || row.first_name,
            lastName: row.lastName || row.last_name,
            dateOfBirth: new Date(row.dateOfBirth || row.date_of_birth),
            gender: row.gender,
            medicalRecordNumber: row.medicalRecordNumber || row.medical_record_number,
            room: row.room || null,
            status: row.status || 'active',
            admissionDate: row.admissionDate || row.admission_date ? new Date(row.admissionDate || row.admission_date) : null,
          };

          // Validate the patient data
          const validatedData = insertPatientSchema.parse(patientData);
          patients.push(validatedData);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Row ${rowIndex}: ${errorMsg}`);
        }
      })
      .on('end', () => {
        resolve({ patients, errors });
      })
      .on('error', (error) => {
        errors.push(`CSV parsing error: ${error.message}`);
        resolve({ patients, errors });
      });
  });
}

export function parseSqlFile(fileContent: string): { patients: InsertPatient[], errors: string[] } {
  const patients: InsertPatient[] = [];
  const errors: string[] = [];
  
  try {
    // Extract INSERT statements
    const insertRegex = /INSERT\s+INTO\s+patients?\s*\([^)]+\)\s*VALUES\s*\([^)]+\)/gi;
    const matches = fileContent.match(insertRegex);
    
    if (!matches) {
      errors.push('No valid INSERT statements found in SQL file');
      return { patients, errors };
    }

    matches.forEach((insertStatement, index) => {
      try {
        // Parse VALUES part
        const valuesMatch = insertStatement.match(/VALUES\s*\(([^)]+)\)/i);
        if (!valuesMatch) {
          errors.push(`Statement ${index + 1}: Could not parse VALUES clause`);
          return;
        }

        // Simple CSV parsing of values (handles quoted strings)
        const values = valuesMatch[1].split(',').map(v => 
          v.trim().replace(/^['"]|['"]$/g, '') // Remove quotes
        );

        // Map values to patient data (assuming standard column order)
        const patientData = {
          firstName: values[0],
          lastName: values[1],
          dateOfBirth: new Date(values[2]),
          gender: values[3],
          medicalRecordNumber: values[4],
          room: values[5] || null,
          status: values[6] || 'active',
          admissionDate: values[7] ? new Date(values[7]) : null,
        };

        // Validate the patient data
        const validatedData = insertPatientSchema.parse(patientData);
        patients.push(validatedData);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Statement ${index + 1}: ${errorMsg}`);
      }
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`SQL parsing error: ${errorMsg}`);
  }

  return { patients, errors };
}