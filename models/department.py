import numpy as np
import xgboost as xgb
import pickle


def train_and_predict_xgb(X_train, y_train, use_gpu=True):


    model = xgb.XGBClassifier(

        n_estimators=300,
        
        max_depth=6,
        
        learning_rate=0.05,
        
        subsample=0.8,
        
        colsample_bytree=0.8,
        
        objective="multi:softprob",
        
        num_class=len(np.unique(y_train)),
        
        eval_metric="mlogloss",
        
        tree_method="gpu_hist" if use_gpu else "hist",
        
    )

    model.fit(X_train, y_train)

    predictions = model.predict(X_predict)
    loss = model.evals_result() if model.evals_result() else None
    print(f"Training XGBoost Loss: {loss}")
    pickle.dump(model, open("xg.pkl", "wb"))
    return predictions, model
