import torch
import numpy as np
from transformers import AutoTokenizer, AutoModel
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

# --------- 1. CONFIG & MODELS ---------
MODEL_NAME = "emilyalsentzer/Bio_ClinicalBERT"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
bert_model = AutoModel.from_pretrained(MODEL_NAME, use_safetensors=True).to(DEVICE)
bert_model.eval()

# --------- 2. EMBEDDING FUNCTION ---------
def get_symptom_embedding(text_list):
    encoded = tokenizer(text_list, padding=True, truncation=True, max_length=64, return_tensors="pt")
    encoded = {key: val.to(DEVICE) for key, val in encoded.items()}
    with torch.no_grad():
        outputs = bert_model(**encoded)
    return outputs.last_hidden_state[:, 0, :] # CLS Token

# --------- 3. PREPARE DATA (Solving the NameError) ---------
# In a real hackathon, this would be your list of 1000+ synthetic symptoms
symptoms_list = [
    "Severe chest pain radiating to left arm", 
    "Mild cough and runny nose",
    "Sudden weakness in face and slurred speech"
]
# Labels: 2=High, 0=Low, 2=High
labels = np.array([2, 0, 2]) 

# Generate the variable that was missing!
print("Generating BERT embeddings...")
embeddings_tensor = get_symptom_embedding(symptoms_list)
X = embeddings_tensor.cpu().numpy() # Now 'X' is defined correctly
y = labels

# --------- 4. STACKING ENSEMBLE (LR -> RF) ---------
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

# Layer 1: Logistic Regression
lr_baseline = LogisticRegression(max_iter=1000)
lr_baseline.fit(X_train, y_train)
train_probs = lr_baseline.predict_proba(X_train)

# Layer 2: Random Forest
rf_final = RandomForestClassifier(n_estimators=100)
rf_final.fit(train_probs, y_train)

print("Model trained successfully!")