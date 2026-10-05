import json
import logging
import os
import joblib
import numpy as np
import pandas as pd
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

logger = logging.getLogger(__name__)

# Load the trained model once at module load
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")

try:
    model = joblib.load(MODEL_PATH)
    logger.info("Successfully loaded model from %s", MODEL_PATH)
except Exception as e:
    logger.error("Failed to load model from %s: %s", MODEL_PATH, e)
    model = None

# Exact feature order expected by the trained scikit-learn model
FEATURE_SPECS = [
    {"name": "age", "label": "Age", "type": float, "min": 1, "max": 120},
    {"name": "sex", "label": "Sex (0=Female, 1=Male)", "type": int, "min": 0, "max": 1},
    {"name": "cp", "label": "Chest Pain Type (0-3)", "type": int, "min": 0, "max": 3},
    {"name": "trestbps", "label": "Resting Blood Pressure", "type": float, "min": 50, "max": 300},
    {"name": "chol", "label": "Cholesterol (mg/dl)", "type": float, "min": 50, "max": 700},
    {"name": "fbs", "label": "Fasting Blood Sugar > 120 mg/dl (0=No, 1=Yes)", "type": int, "min": 0, "max": 1},
    {"name": "restecg", "label": "Resting ECG Results (0-2)", "type": int, "min": 0, "max": 2},
    {"name": "thalach", "label": "Max Heart Rate Achieved", "type": float, "min": 50, "max": 250},
    {"name": "exang", "label": "Exercise Induced Angina (0=No, 1=Yes)", "type": int, "min": 0, "max": 1},
    {"name": "oldpeak", "label": "ST Depression (oldpeak)", "type": float, "min": 0.0, "max": 10.0},
    {"name": "slope", "label": "Slope of Peak Exercise ST (0-2)", "type": int, "min": 0, "max": 2},
    {"name": "ca", "label": "Number of Major Vessels (0-4)", "type": int, "min": 0, "max": 4},
    {"name": "thal", "label": "Thalassemia (0-3)", "type": int, "min": 0, "max": 3},
]

FEATURE_NAMES = [spec["name"] for spec in FEATURE_SPECS]


def extract_features(request):
    """
    Extracts features from either a JSON payload or form-encoded POST data.
    Supports:
      1) JSON object with key-value pairs: {"age": 63, "sex": 1, ...}
      2) JSON object with features array: {"features": [63, 1, ...]}
      3) JSON array: [63, 1, ...]
      4) Form-data with features[] list (legacy template)
      5) Form-data with named fields (age=63, sex=1, ...)
    """
    content_type = request.content_type or ""
    data = {}

    if "application/json" in content_type:
        try:
            body = json.loads(request.body.decode("utf-8"))
        except (ValueError, UnicodeDecodeError) as e:
            raise ValueError(f"Invalid JSON body: {str(e)}")

        if isinstance(body, list):
            if len(body) != len(FEATURE_NAMES):
                raise ValueError(
                    f"Expected list with {len(FEATURE_NAMES)} features, got {len(body)}"
                )
            return {name: body[i] for i, name in enumerate(FEATURE_NAMES)}

        if isinstance(body, dict):
            if "features" in body:
                raw_features = body["features"]
                if isinstance(raw_features, list):
                    if len(raw_features) != len(FEATURE_NAMES):
                        raise ValueError(
                            f"Expected 'features' array of length {len(FEATURE_NAMES)}, got {len(raw_features)}"
                        )
                    return {name: raw_features[i] for i, name in enumerate(FEATURE_NAMES)}
                elif isinstance(raw_features, dict):
                    data = raw_features
                else:
                    raise ValueError("'features' must be an array or object")
            else:
                data = body

    elif request.POST.getlist("features[]"):
        # Legacy template compatibility: features[] array
        raw_list = request.POST.getlist("features[]")
        if len(raw_list) != len(FEATURE_NAMES):
            raise ValueError(
                f"Expected {len(FEATURE_NAMES)} features in features[], got {len(raw_list)}"
            )
        return {name: raw_list[i] for i, name in enumerate(FEATURE_NAMES)}
    else:
        # Standard POST form
        data = request.POST.dict()

    return data


def validate_and_format_features(raw_dict):
    """
    Validates existence, numeric type, and ranges for each required feature.
    Returns a dict of parsed numeric values matching FEATURE_NAMES.
    """
    missing = []
    invalid = []
    parsed = {}

    for spec in FEATURE_SPECS:
        name = spec["name"]
        val = raw_dict.get(name)

        if val is None or str(val).strip() == "":
            missing.append(name)
            continue

        try:
            num = float(val)
            if spec["type"] is int:
                if not num.is_integer() and not (0 <= num <= spec["max"]):
                    invalid.append(f"{name}: must be an integer between {spec['min']} and {spec['max']}")
                    continue
                num_val = int(num)
            else:
                num_val = num

            if not (spec["min"] <= num_val <= spec["max"]):
                invalid.append(f"{name}: {num_val} is outside allowed range [{spec['min']}, {spec['max']}]")
            else:
                parsed[name] = num_val
        except (ValueError, TypeError):
            invalid.append(f"{name}: '{val}' is not a valid number")

    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")
    if invalid:
        raise ValueError(f"Invalid field values: {'; '.join(invalid)}")

    return parsed


@csrf_exempt
@require_http_methods(["GET", "POST"])
def predict_api(request):
    """
    API endpoint for heart disease prediction.
    GET: renders form.html (if called directly in browser)
    POST: accepts JSON or form-data, returns prediction & probability
    """
    if request.method == "GET":
        return render(request, "predictor/form.html")

    if model is None:
        return JsonResponse(
            {"error": "ML model is not loaded. Check server configuration."},
            status=500
        )

    try:
        raw_data = extract_features(request)
        clean_data = validate_and_format_features(raw_data)

        # Build DataFrame with exact feature order to match model.feature_names_in_
        row = [clean_data[col] for col in FEATURE_NAMES]
        features_df = pd.DataFrame([row], columns=FEATURE_NAMES)

        # Real prediction from model.pkl
        prediction = int(model.predict(features_df)[0])

        response_payload = {
            "status": "success",
            "prediction": prediction,
            "risk_level": "High" if prediction == 1 else "Low",
            "message": (
                "⚠️ High Risk of Heart Disease"
                if prediction == 1
                else "✅ Low Risk of Heart Disease"
            ),
            "disclaimer": "This project is for educational purposes only and is not a medical diagnostic tool.",
        }

        # Calculate prediction probability if supported
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(features_df)[0]
            heart_disease_prob = float(probs[1])
            healthy_prob = float(probs[0])
            response_payload["probability"] = round(heart_disease_prob, 4)
            response_payload["risk_percentage"] = round(heart_disease_prob * 100, 1)
            response_payload["probabilities"] = {
                "healthy": round(healthy_prob, 4),
                "heart_disease": round(heart_disease_prob, 4),
            }

        return JsonResponse(response_payload, status=200)

    except ValueError as ve:
        return JsonResponse({"error": str(ve)}, status=400)
    except Exception as e:
        logger.exception("Prediction failure: %s", e)
        return JsonResponse({"error": f"Prediction failed: {str(e)}"}, status=500)


def form_view(request):
    """
    Renders the classic HTML template for root view.
    """
    return render(request, "predictor/form.html")


def health_check(request):
    """
    Health check probe for deployment monitoring.
    """
    return JsonResponse({
        "status": "healthy",
        "model_loaded": model is not None,
        "features": FEATURE_NAMES,
        "model_type": str(type(model).__name__) if model is not None else None,
    }, status=200 if model is not None else 503)