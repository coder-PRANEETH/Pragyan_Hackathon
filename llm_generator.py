import pandas as pd
import shap
import torch
from lime.lime_text import LimeTextExplainer
from transformers import pipeline
from risk_classification import train_random_forest

# ==========================================
# 1. XAI LOGIC (SHAP & LIME)
# ==========================================



def get_numeric_attribution(X_input, model):
    explainer = shap.TreeExplainer(model)
    shap_vals = explainer.shap_values(X_input)

    if isinstance(shap_vals, list):  # Binary classifier
        impacts = shap_vals[1][0]
    else:
        impacts = shap_vals[0]

    numeric_scores = dict(zip(X_input.columns, impacts))

    # Sort by importance (top 5)
    sorted_scores = dict(
        sorted(numeric_scores.items(), key=lambda x: abs(x[1]), reverse=True)[:5]
    )

    return sorted_scores


def get_text_attribution(text, model_predict_proba):
    explainer = LimeTextExplainer(class_names=['Low Risk', 'High Risk'])

    exp = explainer.explain_instance(
        text,
        model_predict_proba,
        num_features=5,
        num_samples=300
    )

    return dict(exp.as_list())


def get_model_explanation(numeric_df, text_string, model_numeric, model_text_pipeline):
    numeric_scores = get_numeric_attribution(numeric_df, model_numeric)
    text_scores = get_text_attribution(text_string, model_text_pipeline.predict_proba)

    return {
        "numeric_features": numeric_scores,
        "text_features": text_scores
    }


# ==========================================
# 2. LLM LOGIC (Stable GPU Version)
# ==========================================

model_id = "microsoft/Phi-3-mini-4k-instruct"

llm_pipeline = pipeline(
    "text-generation",
    model=model_id,
    trust_remote_code=True,
    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
    device=0 if torch.cuda.is_available() else -1
)


def generate_llm_justification(explanation_payload):

    num_data = "\n".join(
        [f"- {k} contributed {v:+.2f} to risk"
         for k, v in explanation_payload['numeric_features'].items()]
    )

    txt_data = "\n".join(
        [f"- Word '{w}' contributed {v:+.2f}"
         for w, v in explanation_payload['text_features'].items()]
    )

    prompt = f"""<|system|>
You are a medical risk analyst.
Explain clearly why this patient was predicted as HIGH RISK.
Be clinical and concise.
<|end|>
<|user|>
Numeric Factors:
{num_data}

Text Factors:
{txt_data}
<|end|>
<|assistant|>
"""

    outputs = llm_pipeline(
        prompt,
        max_new_tokens=150,
        do_sample=False
    )

    return outputs[0]["generated_text"].split("<|assistant|>")[-1].strip()


# ==========================================
# 3. EXECUTION BLOCK
# ==========================================

if __name__ == "__main__":

    df_input = pd.DataFrame(
        [[190, 87, 22]],
        columns=['Height', 'Weight', 'Age']
    )

    patient_complaint = "Patient reports sharp chest pain and shortness of breath."

    try:
        payload = get_model_explanation(
            df_input,
            patient_complaint,
            rf_model,               # Make sure trained model is loaded
            text_clf_pipeline       # Make sure trained text model is loaded
        )

        result = generate_llm_justification(payload)

        print("\n✅ ANALYSIS COMPLETE:\n")
        print(result)

    except NameError as e:
        print(f"\n❌ VARIABLE MISSING: {e}")
        print("💡 Run your training notebook first to define rf_model and text_clf_pipeline.")
