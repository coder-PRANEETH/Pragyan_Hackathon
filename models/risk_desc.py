
def sort_patients_by_risk(patients):
    # Sort patients based on their risk scores in descending order
    return sorted(patients, key=lambda x: x["risk_score"], reverse=True)
