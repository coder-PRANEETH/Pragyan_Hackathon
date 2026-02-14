import pandas as pd
import os

def extract_advanced_clinical_data(file_path):
    try:


        df = pd.read_csv(file_path, low_memory=False)
        

        column_mapping = {
            'Patient_ID': 'patient_id',      
            'Age': 'age',
            'Gender': 'gender',
            'Symptoms': 'symptoms',           
            'Blood Pressure': 'bp_systemic',  
            'Heart Rate': 'heart_rate',      
            'Temperature': 'temperature',
            'Pre-Existing Conditions': 'comorbidities', 
            'Risk_Level': 'risk_score'        
        }


        existing_cols = {target: actual for target, actual in column_mapping.items() if actual in df.columns}
        
        if not existing_cols:

            return "Error: None of the target columns were found in the CSV."



        extracted_df = df[list(existing_cols.values())].copy()

        extracted_df.rename(columns={v: k for k, v in existing_cols.items()}, inplace=True)


        if 'Age' in extracted_df.columns:

            extracted_df['Age'] = pd.to_numeric(extracted_df['Age'], errors='coerce')
        

        for col in ['Heart Rate', 'Temperature']:

            if col in extracted_df.columns:

                extracted_df[col] = pd.to_numeric(extracted_df[col], errors='coerce')


        if 'Patient_ID' in extracted_df.columns:

            extracted_df = extracted_df.dropna(subset=['Patient_ID'])

        return extracted_df

    except FileNotFoundError:

        return "Error: File not found. Please check the file path."
    
    except Exception as e:

        return f"An unexpected error occurred: {e}"


file_input = 'your_new_ehr_file.csv' 


if os.path.exists(file_input):
    
    clinical_data = extract_advanced_clinical_data(file_input)
    
    if isinstance(clinical_data, pd.DataFrame):

        print(f"Successfully extracted {len(clinical_data)} records.")

        print(clinical_data.head())
        
        
        clinical_data.to_csv('extracted_vitals_report.csv', index=False)
else:
    print(f"Please place '{file_input}' in the folder or update the file_input variable.")