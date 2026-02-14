def classify_patient_risk_gpu(cls_embeddings, ehr_data, lr_gpu, rf_gpu):
    cls_embeddings = cls_embeddings.contiguous()
    text_features_gpu = cp.fromDlpack(
        torch.utils.dlpack.to_dlpack(cls_embeddings)
    )

    structured_features_gpu = cp.asarray(ehr_data, dtype=cp.float32)

    final_input_gpu = cp.concatenate(
        (text_features_gpu, structured_features_gpu),
        axis=1
    ).astype(cp.float32)

    base_probs_gpu = lr_gpu.predict_proba(final_input_gpu)
    risk_prediction_gpu = rf_gpu.predict(base_probs_gpu)

    risk_mapping = {0: "Low", 1: "Medium", 2: "High"}
    return [risk_mapping[int(r)] for r in risk_prediction_gpu]
