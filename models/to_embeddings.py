import torch
from transformers import AutoTokenizer, AutoModel


# --------- FUNCTION TO GET EMBEDDINGS ---------
def get_symptom_embedding(text_list):
    # --------- CONFIG ---------
    MODEL_NAME = "emilyalsentzer/Bio_ClinicalBERT"
    DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # --------- LOAD MODEL ---------
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModel.from_pretrained(
        MODEL_NAME,
        use_safetensors=True
    )

    model.to(DEVICE)
    model.eval()
    """
    text_list: list of symptom strings
    returns: tensor of shape (batch_size, hidden_size)
    """
    
    # Tokenize
    encoded = tokenizer(
        text_list,
        padding=True,
        truncation=True,
        max_length=64,   # short phrases, so 64 is enough
        return_tensors="pt"
    )
    
    # Move to GPU
    encoded = {key: val.to(DEVICE) for key, val in encoded.items()}
    
    with torch.no_grad():
        outputs = model(**encoded)
    
    # CLS token embedding (recommended for classification tasks)
    cls_embeddings = outputs.last_hidden_state[:, 0, :]
    
    return cls_embeddings


# --------- EXAMPLE ---------
symptoms = [
    "Severe chest pain radiating to left arm",
    "High fever and persistent cough",
    "Sudden loss of consciousness"
]

embeddings = get_symptom_embedding(symptoms)

print("Embedding shape:", embeddings.shape)
