from explanation import predict_single_with_explanation
import pickle
from to_embeddings import get_symptom_embedding


# Load model
xg_model = pickle.load(open("xg.pkl", "rb"))
risk_model = pickle.load(open("risk_model.pkl", "rb"))

def output(user_data,symptoms):
    # Get symptom embedding
    symptom_embedding = get_symptom_embedding(symptoms)
    data=[]
    
    for i in ["Age","Gender","Blood_Pressure","Heart_Rate","Temperature","Pre-Existing_Conditions"]:
        data.append(user_data[i])

    data.insert(2, symptom_embedding)

    risk,risk_explanation = predict_single_with_explanation(risk_model, data)
    department, department_explanation = predict_single_with_explanation(xg_model, data)