from explanation import predict_single_with_explanation
import pickle
from to_embeddings import get_symptom_embedding
import joblib
risk_model = joblib.load("risk_model.pkl")


# Load model
xg_model = pickle.load(open("xg.pkl", "rb"))

def output(user_data, symptoms):

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
    import numpy as np
    X_sample = np.array(data).reshape(1, -1)

    # Predict
    risk, risk_explanation = predict_single_with_explanation(
        risk_model,
        X_sample,["Age", "Gender", "Blood_Pressure", "Heart_Rate", "Temperature", "Pre-Existing_Conditions"]
    )

    department, department_explanation = predict_single_with_explanation(
        xg_model,
        X_sample,["Age", "Gender", "Blood_Pressure", "Heart_Rate", "Temperature", "Pre-Existing_Conditions"]
    )
    dictory = {
        0: "Low Risk",  
        1: "Medium Risk",
        2: "High Risk"}
 
    return {
        "risk": dictory[risk],
        "risk_explanation": risk_explanation,
        "department": department,
        "department_explanation": department_explanation
    }
out = output({"Age": 45, "Gender": "Male", "Blood_Pressure": 120, "Heart_Rate": 75, "Temperature": 98.6, "Pre-Existing_Conditions": "None"}, ["Primary complaint: severe fatigue. The issue began earlier today"])
print(out)