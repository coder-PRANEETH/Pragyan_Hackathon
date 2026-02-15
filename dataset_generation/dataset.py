import pandas as pd
import numpy as np
from sdv.single_table import CTGANSynthesizer
from sdv.metadata import Metadata

# ----------------------------

# STEP 1: LOAD DATASET

# ----------------------------

df = pd.read_csv("healthcare-dataset-stroke-data.csv")

# Remove rows with missing BMI

df = df.dropna(subset=["bmi"]).reset_index(drop=True)

# ----------------------------

# STEP 2: CREATE TRIAGE FEATURES

# ----------------------------

# Gender

df["Gender"] = df["gender"].replace({
"Male": "Male",
"Female": "Female",
"Other": "Female"
})

# Age

df["Age"] = df["age"].astype(int)

# Pre-existing conditions

def condition(row):
    if row["hypertension"] == 1 and row["heart_disease"] == 1:
            return "Heart Disease"
    elif row["hypertension"] == 1:
        return "Hypertension"
    elif row["heart_disease"] == 1:
        return "Cardiac Issue"
    else:
        return "None"

df["Pre-Existing_Conditions"] = df.apply(condition, axis=1)

# Symptoms

def symptoms(row):
    if row["avg_glucose_level"] > 180:
        return "Severe Fatigue"
    elif row["bmi"] > 32:
        return "Breathlessness"
    elif row["ever_married"] == "Yes":
        return "Chest Discomfort"
    else:
        return "Headache"

df["Symptoms"] = df.apply(symptoms, axis=1)

import random



# sentence templates
templates = [
    "The patient reports {}.",
    "Patient complains of {} since this morning.",
    "Individual presenting with {}.",
    "Patient arrived with symptoms of {}.",
    "The person is experiencing {} and came to the hospital.",
    "Patient states they have been having {}.",
    "Primary complaint: {}.",
    "Patient reports suffering from {} for the past few hours."
]

# optional expansions
extra_context = [
    "",
    " The condition started suddenly.",
    " Symptoms have been worsening.",
    " There is significant discomfort.",
    " The issue began earlier today.",
    " Pain intensity is increasing.",
    " The patient looks distressed.",
]

def expand_symptom(symptom):
    base = symptom.lower()
    sentence = random.choice(templates).format(base)
    sentence += random.choice(extra_context)
    return sentence

# Apply transformation
df["Symptoms"] = df["Symptoms"].apply(expand_symptom)


# mapping rules
def recommend_department(symptom):

    symptom = str(symptom).lower()

    if "chest" in symptom:
        return "Cardiology"

    elif "breath" in symptom:
        return "Pulmonology"

    elif "fatigue" in symptom:
        return "General Medicine"

    elif "headache" in symptom:
        return "Neurology"

    else:
        return "General Medicine"

# create new column
df["Department"] = df["Symptoms"].apply(recommend_department)






# Vital signs

np.random.seed(42)

df["Blood_Pressure"] = (110 + df["hypertension"]*35 + np.random.randint(-10,10,len(df))).clip(90,190)
df["Heart_Rate"] = (72 + df["heart_disease"]*30 + np.random.randint(-15,15,len(df))).clip(55,140)
df["Temperature"] = np.round(np.random.normal(98.6, 1.2, len(df)), 1).clip(96,104)

# Risk level

def risk(row):
    score = 0
    if row["Age"] > 60: score += 2
    if row["Blood_Pressure"] > 150: score += 2
    if row["Heart_Rate"] > 110: score += 2
    if row["Pre-Existing_Conditions"] != "None": score += 2
    if row["stroke"] == 1: score += 3

    
    if score >= 7:
            return "High"
    elif score >= 4:
            return "Medium"
    else:
            return "Low"
    

df["Risk_Level"] = df.apply(risk, axis=1)

# Final dataset (REMOVE Patient_ID FROM TRAINING)

triage_df = df[[
"Age",
"Gender",
"Symptoms",
"Blood_Pressure",
"Heart_Rate",
"Temperature",
"Pre-Existing_Conditions",
"Risk_Level","Department"
]]

# ----------------------------

# IMPORTANT: REMOVE REMAINDER ROWS

# ----------------------------

BATCH_SIZE = 50  # compatible with pac=10

usable_rows = (len(triage_df) // BATCH_SIZE) * BATCH_SIZE
triage_df = triage_df.iloc[:usable_rows]

print("Training rows used:", len(triage_df))

# ----------------------------

# STEP 3: METADATA (NEW API)

# ----------------------------

metadata = Metadata.detect_from_dataframe(triage_df)

categorical_columns = [
"Gender",
"Symptoms",
"Pre-Existing_Conditions",
"Risk_Level"
]

for col in categorical_columns:
    metadata.update_column(column_name=col, sdtype="categorical")

# ----------------------------

# STEP 4: TRAIN CTGAN

# ----------------------------

model = CTGANSynthesizer(
metadata=metadata,
epochs=300,
batch_size=BATCH_SIZE,
pac=10,
verbose=True
)

model.fit(triage_df)
model.save("ctgan_model.pkl")

print("SDV model trained successfully!")

# -----
