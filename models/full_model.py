from explanation import predict_single_with_explanation
import pickle
from to_embeddings import get_symptom_embedding
import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
import uvicorn

# Initialize FastAPI app
app = FastAPI(
    title="Medical Triage API",
    description="API for medical risk assessment and department recommendation",
    version="1.0.0"
)

# CORS middlewareuvicorn full_model:app --host 0.0.0.0 --port 8000 --reload
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model variables
risk_model = None
xg_model = None

@app.on_event("startup")
def load_models():
    """Load models once at startup"""
    global risk_model, xg_model
    try:
        risk_model = joblib.load("risk_model.pkl")
        xg_model = pickle.load(open("xg.pkl", "rb"))
        print("Models loaded successfully")
    except Exception as e:
        print(f"Error loading models: {e}")
        raise

# Request models
class UserData(BaseModel):
    Age: int = Field(..., ge=0, le=150, description="Age of the patient")
    Gender: str = Field(..., description="Gender: 'Male' or 'Female'")
    Blood_Pressure: float = Field(..., ge=0, description="Blood pressure reading")
    Heart_Rate: float = Field(..., ge=0, description="Heart rate in bpm")
    Temperature: float = Field(..., ge=0, description="Body temperature in Fahrenheit")
    Pre_Existing_Conditions: str = Field(..., description="Pre-existing conditions or 'None'")

class PredictionRequest(BaseModel):
    user_data: UserData
    symptoms: List[str] = Field(..., min_items=1, description="List of symptom descriptions")

class PredictionResponse(BaseModel):
    risk: str
    risk_explanation: str
    department: str
    department_explanation: str

def output(user_data, symptoms):
    """Main prediction function"""
    # Get embedding (shape: (1, 768))
    symptom_embedding = get_symptom_embedding(
        symptoms
    ).cpu().numpy()[0]   # (768,)

    # Encode categorical values properly
    gender = 1 if user_data["Gender"] == "Female" else 0
    pre_existing = 0 if user_data["Pre-Existing_Conditions"] == "None" else 1

    # Base structured features
    data = [
        user_data["Age"],
        gender,
        user_data["Blood_Pressure"],
        user_data["Heart_Rate"],
        user_data["Temperature"],
        pre_existing
    ]

    # Add all embedding values (768 numbers)
    data.extend(symptom_embedding.tolist())

    # Convert to numpy and reshape
    X_sample = np.array(data).reshape(1, -1)

    # Predict
    risk, risk_explanation = predict_single_with_explanation(
        risk_model,
        X_sample,
        ["Age", "Gender", "Blood_Pressure", "Heart_Rate", "Temperature", "Pre-Existing_Conditions"]
    )

    department, department_explanation = predict_single_with_explanation(
        xg_model,
        X_sample,
        ["Age", "Gender", "Blood_Pressure", "Heart_Rate", "Temperature", "Pre-Existing_Conditions"]
    )

    risk_dict = {
        0: "Low Risk",
        1: "Medium Risk",
        2: "High Risk"
    }
    department_dict = {
    0: "Cardiology",
    1: "Neurology",
    2: "Orthopedics",
    3: "General Medicine"
}


    return {
    "risk": risk_dict[int(risk)],
    "risk_explanation": risk_explanation,
    "department": department_dict[int(department)],
    "department_explanation": department_explanation
}


# API Endpoints
@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """
    Predict risk level and recommended department based on patient data and symptoms.

    Returns risk classification (Low/Medium/High Risk) and department recommendation
    with explanations based on SHAP values.
    """
    try:
        user_data_dict = {
            "Age": request.user_data.Age,
            "Gender": request.user_data.Gender,
            "Blood_Pressure": request.user_data.Blood_Pressure,
            "Heart_Rate": request.user_data.Heart_Rate,
            "Temperature": request.user_data.Temperature,
            "Pre-Existing_Conditions": request.user_data.Pre_Existing_Conditions
        }
        result = output(user_data_dict, request.symptoms)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.get("/health")
async def health_check():
    """Check if the API and models are loaded correctly."""
    return {
        "status": "healthy",
        "models_loaded": risk_model is not None and xg_model is not None
    }

@app.get("/")
async def root():
    """API information."""
    return {
        "message": "Medical Triage API",
        "version": "1.0.0",
        "endpoints": {
            "/predict": "POST - Predict risk and department",
            "/health": "GET - Health check",
            "/docs": "GET - API documentation"
        }
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
