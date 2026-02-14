import torch
from transformers import pipeline

# 1. Initialize Llama 3 (Ensure you have access via HuggingFace)
model_id = "meta-llama/Meta-Llama-3-8B-Instruct"
llm_pipeline = pipeline(
    "text-generation",
    model=model_id,
    model_kwargs={"torch_dtype": torch.bfloat16},
    device_map="auto",
)

def generate_llm_justification(explanation_payload):
    # Format Numeric SHAP data
    numeric_str = "\n".join([f"- {k}: {v:+.2f} impact" for k, v in explanation_payload['numeric_features'].items()])
    
    # Format Text LIME data
    text_str = "\n".join([f"- '{word}': {weight:+.2f} contribution" for word, weight in explanation_payload['text_features'].items()])

    # Construct the Llama 3 Prompt Template
    messages = [
        {"role": "system", "content": "You are a clinical AI assistant. You will be given mathematical feature importance scores from SHAP and LIME. Your job is to provide a human-readable justification for the model's prediction based ONLY on these weights."},
        {"role": "user", "content": f"""
        The model predicted: HIGH RISK.
        
        Mathematical Evidence (SHAP - Tabular):
        {numeric_str}
        
        Mathematical Evidence (LIME - Textual):
        {text_str}
        
        Synthesize this into a 2-sentence explanation for a doctor. Focus on the most impactful features.
        """},
    ]

    # Generate Response
    prompt = llm_pipeline.tokenizer.apply_chat_template(
        messages, 
        tokenize=False, 
        add_generation_prompt=True
    )
    
    outputs = llm_pipeline(
        prompt,
        max_new_tokens=256,
        do_sample=True,
        temperature=0.6,
        top_p=0.9,
    )
    
    return outputs[0]["generated_text"][len(prompt):]

# --- EXECUTION ---
payload = get_model_explanation(df, text, rf_model, tfidf_pipeline)
print(generate_llm_justification(payload))