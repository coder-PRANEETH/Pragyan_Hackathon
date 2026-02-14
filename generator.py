import os
from dotenv import load_dotenv
from google import genai  # <--- Use the NEW package

# 1. Load environment variables
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

# 2. Initialize the Client (Modern 2026 Syntax)
# This replaces genai.configure()
client = genai.Client(api_key=api_key)

def generate_narrative(payload):
    # Construct the prompt
    prompt = f"""
    Act as a medical XAI expert. Translate these scores into a clinical summary:
    - Final Prediction: {payload['final_prediction']}
    - Numeric Drivers (SHAP): {payload['numeric_scores']}
    - Text Drivers (LIME): {payload['text_scores']}
    
    Instruction: Write 2 professional sentences for a doctor.
    """
    
    # 3. Call generate_content via the models service
    response = client.models.generate_content(
        model='gemini-2.0-flash', # Or your specific hackathon model
        contents=prompt
    )
    
    return response.text