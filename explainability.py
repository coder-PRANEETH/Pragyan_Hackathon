import shap
from lime.lime_text import LimeTextExplainer
import pandas as pd

def get_numeric_attribution(X_input, model):
    """
    X_input: DataFrame containing a single row.
    """
    explainer = shap.TreeExplainer(model)
    # shap_values is often a list for classifiers: [negative_class_shaps, positive_class_shaps]
    shap_vals = explainer.shap_values(X_input)
    
    # Logic for binary classification: capture the 'High Risk' (class 1) impact
    if isinstance(shap_vals, list):
        impacts = shap_vals[1][0] 
    else:
        impacts = shap_vals[0]

    return dict(zip(X_input.columns, impacts))

def get_text_attribution(text, model_predict_pipeline):
    # Ensure class names match your model's intent
    explainer = LimeTextExplainer(class_names=['Low Risk', 'High Risk'])
    
    # Generate local explanation
    exp = explainer.explain_instance(
        text, 
        model_predict_pipeline, 
        num_features=5,
        num_samples=500 # Higher samples = more stable math
    )
    
    return exp.as_list()

def get_model_explanation(numeric_df, text_string, model_numeric, model_text_pipeline):
    """
    Coordinating function to build the Fact Sheet.
    """
    # 1. Get Numeric Impact (SHAP)
    numeric_scores = get_numeric_attribution(numeric_df, model_numeric)
    
    # 2. Get Text Impact (LIME)
    text_scores = get_text_attribution(text_string, model_text_pipeline)
    
    # 3. Construct Payload
    return {
        "numeric_features": numeric_scores,
        "text_features": dict(text_scores),
        "summary": "Data extracted successfully for LLM reasoning."
    }