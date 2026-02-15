from to_embeddings import get_symptom_embedding
from risk_classification import train_random_forest
from department import train_and_predict_xgb
from explanation import predict_with_explanation
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder

dataset = pd.read_csv("datase.csv")
testset = pd.read_csv("testdata.csv")
symptom_texts = dataset["Symptoms"].tolist()
symptom_embeddings = get_symptom_embedding(symptom_texts).cpu().numpy()

# Encode department
dept_encoder = LabelEncoder()
dataset["Department"] = dept_encoder.fit_transform(dataset["Department"])
testset["Department"] = dept_encoder.transform(testset["Department"])



pre_encoder = LabelEncoder()

dataset["Pre-Existing_Conditions"] = pre_encoder.fit_transform(
    dataset["Pre-Existing_Conditions"]
)

testset["Pre-Existing_Conditions"] = pre_encoder.transform(
    testset["Pre-Existing_Conditions"]
)





# Generate embeddings
symptom_embeddings = get_symptom_embedding(
    dataset["Symptoms"].tolist()
).cpu().numpy()

# Convert to DataFrame
embedding_df = pd.DataFrame(
    symptom_embeddings,
    columns=[f"emb_{i}" for i in range(symptom_embeddings.shape[1])]
)

# Drop original Symptoms column
dataset = dataset.drop(columns=["Symptoms"])

# Split dataset into:
# first 6 columns + rest
first_part = dataset.iloc[:, :6]
second_part = dataset.iloc[:, 6:]

# Insert embeddings after 6th column
dataset = pd.concat(
    [first_part, embedding_df, second_part],
    axis=1
)

sym = testset["Symptoms"].tolist()
symptom_embeddings = get_symptom_embedding(sym).cpu().numpy()
# Generate embeddings
symptom_embeddings = get_symptom_embedding(
    testset["Symptoms"].tolist()
).cpu().numpy()

# Convert to DataFrame
embedding_df = pd.DataFrame(
    symptom_embeddings,
    columns=[f"emb_{i}" for i in range(symptom_embeddings.shape[1])]
)

# Drop original Symptoms column
testset = testset.drop(columns=["Symptoms"])

# Split dataset into:
# first 6 columns + rest
first_part = testset.iloc[:, :6]
second_part = testset.iloc[:, 6:]

# Insert embeddings after 6th column
testset = pd.concat(
    [first_part, embedding_df, second_part],
    axis=1
)

# Features
x_train = dataset.drop(columns=["Risk_Level", "Department"])
y_train = dataset["Risk_Level"]
y_train2 = dataset["Department"]


xtest = testset.drop(columns=["Risk_Level", "Department"])
y_test = testset["Risk_Level"]
y_test2 = testset["Department"]
# Train department 

model,pred = train_random_forest(x_train, y_train)

model2, pred2 = train_and_predict_xgb(x_train, y_train2)


feature_names = x_train.columns[:6].tolist()



risk,accur,ris_expl = predict_with_explanation(model, xtest.values, y_test  , feature_names)

dept,accur2,dept_expl = predict_with_explanation(model2, xtest.values, y_test2, feature_names)

print(f"Risk Prediction:, Accuracy: {accur}")
print(f"Department Prediction:, Accuracy: {accur2}")