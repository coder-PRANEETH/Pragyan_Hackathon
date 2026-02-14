import pandas as pd
import numpy as np
import random
from faker import Faker

from sdv.metadata import SingleTableMetadata
from sdv.single_table import CTGANSynthesizer

fake = Faker()

# ------------------------------------------------

# STEP 1: LOAD REAL DATASET (Stroke Dataset)

# ------------------------------------------------

df = pd.read_csv("healthcare-dataset-stroke-data.csv")

# We will convert this dataset into triage-style patients

# ------------------------------------------------

# STEP 2: CREATE TRIAGE FEATURES

# ------------------------------------------------

# Remove rows with missing BMI

df = df.dropna(subset=["bmi"])

# Convert gender

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

# Symptoms (derived from health indicators)

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

# Blood Pressure (simulated realistic clinical range)

df["Blood_Pressure"] = (110 + df["hypertension"]*35 + np.random.randint(-10,10,len(df))).clip(90,190)

# Heart Rate

df["Heart_Rate"] = (72 + df["heart_disease"]*30 + np.random.randint(-15,15,len(df))).clip(55,140)

# Temperature

df["Temperature"] = np.round(np.random.normal(98.6, 1.2, len(df)), 1).clip(96,104)

# Risk Level

def risk(row):
score = 0
if row["Age"] > 60: score += 2
if row["Blood_Pressure"] > 150: score += 2
if row["Heart_Rate"] > 110: score += 2
if row["Pre-Existing_Conditions"] != "None": score += 2
if row["stroke"] == 1: score += 3

```
if score >= 7:
    return "High"
elif score >= 4:
    return "Medium"
else:
    return "Low"
```

df["Risk_Level"] = df.apply(risk, axis=1)

# Patient ID

df["Patient_ID"] = ["P%05d" % i for i in range(1, len(df)+1)]

# Final schema

triage_df = df[[
"Patient_ID",
"Age",
"Gender",
"Symptoms",
"Blood_Pressure",
"Heart_Rate",
"Temperature",
"Pre-Existing_Conditions",
"Risk_Level"
]]

triage_df.to_csv("real_triage_seed.csv", index=False)
print("Seed dataset created:", triage_df.shape)

# ------------------------------------------------

# STEP 3: TRAIN SDV MODEL (CTGAN)

# ------------------------------------------------

metadata = SingleTableMetadata()
metadata.detect_from_dataframe(triage_df)

# categorical columns

categorical_cols = [
"Gender",
"Symptoms",
"Pre-Existing_Conditions",
"Risk_Level"
]

for col in categorical_cols:
metadata.update_column(column_name=col, sdtype="categorical")

metadata.update_column(column_name="Patient_ID", sdtype="id")

model = CTGANSynthesizer(
metadata,
epochs=400,
batch_size=64,
verbose=True
)

model.fit(triage_df)

print("SDV model trained")

# ------------------------------------------------

# STEP 4: GENERATE 5000 SYNTHETIC PATIENTS

# ------------------------------------------------

synthetic_data = model.sample(5000)

synthetic_data.to_csv("synthetic_triage_5000.csv", index=False)

print("Synthetic dataset generated:", synthetic_data.shape)
