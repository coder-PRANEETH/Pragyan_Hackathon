import pandas as pd
from sdv.single_table import CTGANSynthesizer

# ----------------------------
# STEP 1: LOAD TRAINED MODEL
# ----------------------------

model = CTGANSynthesizer.load("ctgan_model.pkl")

print("Model loaded successfully!")

# ----------------------------
# STEP 2: GENERATE SYNTHETIC DATA
# ----------------------------

NUM_SAMPLES = 20000

synthetic_data = model.sample(num_rows=NUM_SAMPLES)

print(f"{NUM_SAMPLES} synthetic rows generated.")

# ----------------------------
# STEP 3: SAVE DATASET
# ----------------------------

synthetic_data.to_csv("datase.csv", index=False)

print("Saved as datase.csv")
