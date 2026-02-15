import numpy as np
import shap
from sklearn.metrics import accuracy_score
import pandas as pd


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


def predict_single_with_explanation(model, X_sample, top_k=5):
    """
    Predict for a single sample and return prediction + explanation.
    X_sample must be shape (1, n_features).
    """

    # Ensure DataFrame with correct feature names
    if not isinstance(X_sample, pd.DataFrame):
        X_sample = pd.DataFrame(
            X_sample,
            columns=model.feature_names_in_
        )

    # ---- Prediction ----
    pred = model.predict(X_sample)[0]

    # ---- SHAP Explainer ----
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_sample)

    # ---- Handle Different SHAP Output Formats ----
    if isinstance(shap_values, list):
        # Old style multiclass
        contrib = shap_values[pred][0]
    else:
        shap_values = np.array(shap_values)

        if len(shap_values.shape) == 3:
            # (samples, features, classes)
            contrib = shap_values[0, :, pred]
        else:
            # (samples, features)
            contrib = shap_values[0]

    contrib = np.array(contrib).flatten()

    # ---- Get Top Positive Features ----
    indices = np.argsort(contrib)[::-1]

    selected = []

    for idx in indices:
        if contrib[idx] > 0:
            feature_name = model.feature_names_in_[idx]
            selected.append(
                (feature_name, float(contrib[idx]))
            )
        if len(selected) == top_k:
            break

    # ---- Format Explanation ----
    if selected:
        explanation = "Top contributing features: " + ", ".join(
            [f"{name} ({round(value,4)})" for name, value in selected if not name.startswith("emb")]
        )
    else:
        explanation = "No significant positive contributing features found."

    return pred, explanation

