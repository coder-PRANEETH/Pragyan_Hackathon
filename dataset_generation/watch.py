from flask import Flask, redirect, request
import requests
import base64

app = Flask(__name__)

CLIENT_ID = "import re

# -------------------------
# LOAD FILE
# -------------------------

with open("report.txt", "r", encoding="utf-8") as f:
    text = f.read()

lower_text = text.lower()

# -------------------------
# 1. PATIENT ID
# -------------------------

pid = re.search(r'(patient\s*id|id)\s*[:\-]?\s*(p?\d+)', lower_text)
patient_id = pid.group(2).upper() if pid else "UNKNOWN"

# -------------------------
# 2. AGE
# -------------------------

age_match = re.search(r'age\s*(\d{1,3})', lower_text)
age = int(age_match.group(1)) if age_match else None

# -------------------------
# 3. GENDER
# -------------------------

if re.search(r'\bmale\b', lower_text):
    gender = "Male"
elif re.search(r'\bfemale\b', lower_text):
    gender = "Female"
else:
    gender = "Unknown"

# -------------------------
# 4. BLOOD PRESSURE
# -------------------------

bp_match = re.search(r'(\d{2,3}/\d{2,3})\s*mmhg', lower_text)
blood_pressure = bp_match.group(1) if bp_match else None

# -------------------------
# 5. HEART RATE
# -------------------------

hr_match = re.search(r'(heart\s*rate|pulse)\s*(\d{2,3})\s*bpm', lower_text)
heart_rate = int(hr_match.group(2)) if hr_match else None

# -------------------------
# 6. TEMPERATURE
# -------------------------

temp_match = re.search(r'(temperature|temp)\s*(\d{2,3}\.?\d*)\s*f', lower_text)
temperature = float(temp_match.group(2)) if temp_match else None

# -------------------------
# 7. SYMPTOMS
# -------------------------

symptom_keywords = [
    "chest pain",
    "breathlessness",
    "shortness of breath",
    "headache",
    "dizziness",
    "fatigue",
    "vomiting",
    "fever",
    "abdominal pain",
    "cough",
    "nausea"
]

found_symptoms = []
for s in symptom_keywords:
    if s in lower_text:
        found_symptoms.append(s)

symptoms = ", ".join(found_symptoms) if found_symptoms else "Not specified"

# -------------------------
# 8. PRE-EXISTING CONDITIONS
# -------------------------

condition_keywords = [
    "hypertension",
    "diabetes",
    "asthma",
    "heart disease",
    "cardiac disease",
    "stroke",
    "copd",
    "kidney disease"
]

found_conditions = []
for c in condition_keywords:
    if c in lower_text:
        found_conditions.append(c)

conditions = ", ".join(found_conditions) if found_conditions else "None"

# -------------------------
# FINAL OUTPUT
# -------------------------

patient_record = {
    "Patient_ID": patient_id,
    "Age": age,
    "Gender": gender,
    "Symptoms": symptoms,
    "Blood Pressure": blood_pressure,
    "Heart Rate": heart_rate,
    "Temperature": temperature,
    "Pre-Existing Conditions": conditions
}

print("\nExtracted Clinical Record:\n")
for k, v in patient_record.items():
    print(f"{k}: {v}")
"
CLIENT_SECRET = "YOUR_CLIENT_SECRET"
REDIRECT_URI = "http://127.0.0.1:5000/callback"

@app.route("/")
def login():
    auth_url = (
        "https://www.fitbit.com/oauth2/authorize"
        "?response_type=code"
        f"&client_id={CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URI}"
        "&scope=activity heartrate sleep oxygen_saturation respiratory_rate profile"
    )
    return redirect(auth_url)

@app.route("/callback")
def callback():
    code = request.args.get("code")

    credentials = f"{CLIENT_ID}:{CLIENT_SECRET}"
    encoded = base64.b64encode(credentials.encode()).decode()

    headers = {
        "Authorization": f"Basic {encoded}",
        "Content-Type": "application/x-www-form-urlencoded"
    }

    data = {
        "client_id": CLIENT_ID,
        "grant_type": "authorization_code",
        "redirect_uri": REDIRECT_URI,
        "code": code
    }

    token_response = requests.post(
        "https://api.fitbit.com/oauth2/token",
        headers=headers,
        data=data
    )

    token_json = token_response.json()
    access_token = token_json["access_token"]

    return f"ACCESS TOKEN: {access_token}"

if __name__ == "__main__":
    app.run(port=5000)
