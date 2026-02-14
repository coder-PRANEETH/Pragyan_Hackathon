import pandas as pd
import os

def extract_advanced_clinical_data(file_path):
    try:
        # 1. Load the dataset
        df = pd.read_csv(file_path, low_memory=False)
        
        # 2. Define a Mapping Dictionary
        # Because different EHR systems use different headers, 
        # map your desired fields to the likely CSV column names.
        column_mapping = {
            'Patient_ID': 'patient_id',       # or 'uniquepid' / 'pid'
            'Age': 'age',
            'Gender': 'gender',
            'Symptoms': 'symptoms',           # or 'presenting_complaint'
            'Blood Pressure': 'bp_systemic',  # or 'blood_pressure'
            'Heart Rate': 'heart_rate',       # or 'pulse'
            'Temperature': 'temperature',
            'Pre-Existing Conditions': 'comorbidities', 
            'Risk_Level': 'risk_score'        # Optional field
        }

        # 3. Identify which requested columns actually exist in the file
        existing_cols = {target: actual for target, actual in column_mapping.items() if actual in df.columns}
        
        if not existing_cols:
            return "Error: None of the target columns were found in the CSV."

        # 4. Extract and Rename
        # This keeps only the columns found and renames them to your preferred names
        extracted_df = df[list(existing_cols.values())].copy()
        extracted_df.rename(columns={v: k for k, v in existing_cols.items()}, inplace=True)

        # 5. Data Cleaning
        # Convert Age to numeric (handles ">89" or "70s" strings)
        if 'Age' in extracted_df.columns:
            extracted_df['Age'] = pd.to_numeric(extracted_df['Age'], errors='coerce')
        
        # Ensure Heart Rate and Temperature are numeric
        for col in ['Heart Rate', 'Temperature']:
            if col in extracted_df.columns:
                extracted_df[col] = pd.to_numeric(extracted_df[col], errors='coerce')

        # 6. Handle Missing Values
        # Drop rows where Patient_ID is missing
        if 'Patient_ID' in extracted_df.columns:
            extracted_df = extracted_df.dropna(subset=['Patient_ID'])

        return extracted_df

    except FileNotFoundError:
        return "Error: File not found. Please check the file path."
    except Exception as e:
        return f"An unexpected error occurred: {e}"

# --- Execution ---
file_input = 'your_new_ehr_file.csv' # Replace with your actual filename

# Check if file exists before running
if os.path.exists(file_input):
    clinical_data = extract_advanced_clinical_data(file_input)
    
    if isinstance(clinical_data, pd.DataFrame):
        print(f"Successfully extracted {len(clinical_data)} records.")
        print(clinical_data.head())
        
        # Save results
        clinical_data.to_csv('extracted_vitals_report.csv', index=False)
else:
    print(f"Please place '{file_input}' in the folder or update the file_input variable.")