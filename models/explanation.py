import numpy as np
import shap
from sklearn.metrics import accuracy_score


def predict_with_explanation(
    model,
    X_test,                # shape (n_samples, n_features)
    y_true,                # true labels
    feature_names,
    top_k=3
):

    # ---- Predictions ----
    preds = model.predict(X_test)

    # ---- Accuracy (based only on predictions) ----
    accuracy = accuracy_score(y_true, preds)

    # ---- SHAP Explainer (create once) ----
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_test)

    explanations = []

    for i in range(len(X_test)):

        # Select correct class (binary/multiclass safe)
        if isinstance(shap_values, list):
            contrib = shap_values[preds[i]][i]
        else:
            contrib = shap_values[i]

        # Get top positive contributors
        indices = np.argsort(contrib)[::-1]

        selected = []
        for idx in indices:
            if contrib[idx] > 0:
                selected.append(
                    (feature_names[idx], X_test[i][idx])
                )
            if len(selected) == top_k:
                break

        features_text = [
            f"{f[0]} ({f[1]})" for f in selected
        ]

        explanation = (
            f"Prediction influenced mainly by: "
            f"{', '.join(features_text)}."
        )

        explanations.append(explanation)

    return preds, accuracy, explanations


def predict_single_with_explanation(
    model,
    X_sample,          # shape (1, n_features)
    feature_names,
    top_k=3
):

    # ---- Prediction ----
    pred = model.predict(X_sample)[0]

    # ---- SHAP Explainer ----
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_sample)

    # Handle binary / multiclass
    if isinstance(shap_values, list):
        contrib = shap_values[pred][0]
    else:
        contrib = shap_values[0]

    # ---- Top Positive Contributors ----
    indices = np.argsort(contrib)[::-1]

    selected = []
    for idx in indices:
        if contrib[idx] > 0:
            selected.append(
                (feature_names[idx], X_sample[0][idx])
            )
        if len(selected) == top_k:
            break

    # ---- Natural Language ----
    features_text = [
        f"{f[0]} ({f[1]})" for f in selected
    ]

    explanation = (
        f"Prediction influenced mainly by: "
        f"{', '.join(features_text)}."
    )

    return pred, explanation