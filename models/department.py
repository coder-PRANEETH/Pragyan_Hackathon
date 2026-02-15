import numpy as np
import xgboost as xgb
import pickle


def train_and_predict_xgb(X_train, y_train, use_gpu=False):


    model = xgb.XGBClassifier(

        n_estimators=300,
        
        max_depth=6,
        
        learning_rate=0.05,
        
        subsample=0.8,
        
        colsample_bytree=0.8,
        
        objective="multi:softprob",
        
        num_class=len(np.unique(y_train)),
        
        eval_metric="mlogloss",
        
        tree_method="hist",
device="cuda" if use_gpu else "cpu",

        
    )
    print("Training XGBoost model... in ","cuda" if use_gpu else "cpu")

    model.fit(X_train, y_train)

   
    
    
    pickle.dump(model, open("xg.pkl", "wb"))

    
    probs = model.predict_proba(X_train)
    return probs, model
