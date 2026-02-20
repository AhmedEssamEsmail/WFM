// CSV parsing and validation utilities

import { FILE_UPLOAD } from '../constants';

type CSVCellValue = string | number | boolean | null | undefined;
type CSVRow = Record<string, CSVCellValue>;

/**
 * Parse CSV file to array of objects
 * Handles quoted fields properly (e.g., "Smith, John")
 */
export function parseCSV<T = Record<string, string>>(csvText: string): T[] {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return [];

  // Helper function to split CSV line respecting quotes
  const splitCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    // Add last field
    result.push(current.trim());
    return result;
  };

  // Parse header row
  const headers = splitCSVLine(lines[0]);

  // Parse data rows
  const data: T[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i]);
    if (values.length !== headers.length) continue; // Skip malformed rows

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    data.push(row as T);
  }

  return data;
}

/**
 * Convert array of objects to CSV string
 */
export function arrayToCSV<T extends CSVRow>(data: T[]): string {
  if (data.length === 0) return '';

  // Get headers from first object
  const headers = Object.keys(data[0]);
  const headerRow = headers.join(',');

  // Convert data rows
  const dataRows = data.map((row) => {
    return headers
      .map((header) => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      })
      .join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Validate file is CSV
 */
export function isValidCSVFile(file: File): boolean {
  return (
    FILE_UPLOAD.ALLOWED_CSV_TYPES.some((type) => type === file.type) || file.name.endsWith('.csv')
  );
}

/**
 * Validate file size
 */
export function isValidFileSize(file: File): boolean {
  return file.size <= FILE_UPLOAD.MAX_SIZE_BYTES;
}

/**
 * Read file as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}

/**
 * Validate and parse CSV file
 */
export async function validateAndParseCSV<T = Record<string, string>>(
  file: File
): Promise<{ success: true; data: T[] } | { success: false; error: string }> {
  // Validate file type
  if (!isValidCSVFile(file)) {
    return { success: false, error: 'Invalid file type. Please upload a CSV file.' };
  }

  // Validate file size
  if (!isValidFileSize(file)) {
    return { success: false, error: `File size exceeds ${FILE_UPLOAD.MAX_SIZE_MB}MB limit.` };
  }

  try {
    // Read and parse file
    const text = await readFileAsText(file);
    const data = parseCSV<T>(text);

    if (data.length === 0) {
      return { success: false, error: 'CSV file is empty or invalid.' };
    }

    return { success: true, data };
  } catch {
    return { success: false, error: 'Failed to parse CSV file.' };
  }
}
