from to_embeddings import get_symptom_embedding
from risk_classification import train_random_forest
from department import train_and_predict_xgb
from explanation import predict_with_explanation
import pandas as pd
import numpy as np

dataset = pd.read_csv("dataset.csv")
testset = pd.read_csv("testdata.csv")
symptom_texts = dataset["symptoms"].tolist()
symptom_embeddings = get_symptom_embedding(symptom_texts).cpu().numpy()
x_train = dataset.iloc[:, :7]
y_train = dataset["Risk_Level"]
y_train2 = dataset["department"]
xtest = testset.iloc[:, :7]
y_test = testset["Risk_Level"]
y_test2 = testset["department"]
# Train department 


model,pred = train_random_forest(x_train, y_train)

model2, pred2 = train_and_predict_xgb(x_train, y_train2)

feature_names = x_train.columns.tolist()

risk,accur,ris_expl = predict_with_explanation(model, xtest.values, y_test  , feature_names)

dept,accur2,dept_expl = predict_with_explanation(model2, xtest.values, y_test2, feature_names)

print(f"Risk Prediction:, Accuracy: {accur}")
print(f"Department Prediction:, Accuracy: {accur2}")