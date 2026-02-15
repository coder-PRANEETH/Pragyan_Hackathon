import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;


/* -------------------------------
   READ PDF AND EXTRACT TEXT
-------------------------------- */

export async function extractTextFromPDF(file) {

  const arrayBuffer = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {

    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    const pageText = textContent.items.map(item => item.str).join(" ");

    fullText += pageText + "\n";
  }

  return fullText;
}


/* -------------------------------
   MEDICAL FIELD EXTRACTION
-------------------------------- */

export function parseMedicalReport(text) {

  const record = {
    Patient_ID: null,
    Age: null,
    Gender: null,
    Symptoms: null,
    Blood_Pressure: null,
    Heart_Rate: null,
    Temperature: null,
    Pre_Existing_Conditions: null,
    Risk_Level: null
  };

  // Patient ID
  let match = text.match(/Patient\s*ID\s*[:\-]\s*(\w+)/i);
  if (match) record.Patient_ID = match[1];

  // Age
  match = text.match(/Age\s*[:\-]\s*(\d{1,3})/i);
  if (match) record.Age = parseInt(match[1]);

  // Gender
  match = text.match(/Gender\s*[:\-]\s*(Male|Female)/i);
  if (match) record.Gender = match[1];

  // Symptoms
  match = text.match(/(Chief Complaints|Symptoms)\s*[:\-]?\s*(.*?)(Vitals|History|Examination)/is);
  if (match) record.Symptoms = match[2].trim();

  // Blood Pressure
  match = text.match(/Blood\s*Pressure\s*[:\-]?\s*(\d{2,3}\/\d{2,3})/i);
  if (match) record.Blood_Pressure = match[1];

  // Heart Rate / Pulse
  match = text.match(/(Pulse|Heart Rate)\s*[:\-]?\s*(\d{2,3})/i);
  if (match) record.Heart_Rate = parseInt(match[2]);

  // Temperature
  match = text.match(/Temperature\s*[:\-]?\s*(\d{2,3}\.?\d*)/i);
  if (match) record.Temperature = parseFloat(match[1]);

  // Pre-existing conditions
  match = text.match(/(Past Medical History|Medical History)\s*[:\-]?\s*(.*?)(Risk|Medication|$)/is);
  if (match) record.Pre_Existing_Conditions = match[2].trim();

  // Risk Level
  match = text.match(/Risk\s*Level\s*[:\-]?\s*(High|Medium|Low)/i);
  if (match) record.Risk_Level = match[1];

  return record;
}


/* -------------------------------
   MAIN FUNCTION (CALL THIS)
-------------------------------- */

export async function extractMedicalDataFromPDF(file) {

  const text = await extractTextFromPDF(file);

  const data = parseMedicalReport(text);

  return data;
}
