from sklearn.ensemble import RandomForestClassifier


from sklearn.metrics import log_loss
import joblib


def train_random_forest(X_train, y_train):
    """
    Train Random Forest and return model + final loss.
    """

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=None,
        random_state=42
    )

    model.fit(X_train, y_train)


    probs = model.predict_proba(X_train)
    loss = log_loss(y_train, probs)
    print(f"Training risk Loss: {loss:.4f}")
    
    joblib.dump(model, 'risk_model.pkl')
    
    return model, probs
