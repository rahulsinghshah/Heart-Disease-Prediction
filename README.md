# Heart Disease Classification System

A production-ready machine learning web application that predicts cardiovascular disease risk based on patient clinical indicators using a trained **Logistic Regression** model.

## Tech Stack

- **Frontend:** React, Vite, Vanilla CSS (responsive, accessible, with loading and error states)
- **Backend:** Python, Django 5, WhiteNoise (production static assets), Django-CORS-Headers
- **Machine Learning:** scikit-learn (`LogisticRegression`), pandas, numpy, joblib
- **Dataset:** Kaggle Heart Disease Dataset (13 clinical indicators)

---

## Features

- **Real-Time ML Predictions:** Powered by the trained `model.pkl` logistic regression model.
- **Probability & Risk Breakdown:** Displays both binary risk classification (High / Low Risk) and probability percentage.
- **Robust API Validation:** Server-side validation of data types, missing indicators, and biological value ranges.
- **Interactive Demo Presets:** Includes 1-click sample inputs (High Risk & Low Risk) for testing.
- **Responsive UI:** Clean card layout adapting seamlessly from mobile screens to desktop.
- **Production-Ready Backend:** Environment-driven settings, CORS configuration, and WhiteNoise static asset serving.

---

## Project Structure

```text
├── HeartDisease/                 # Django Backend
│   ├── HeartDisease/             # Django project settings, WSGI, URLs
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── predictor/                # Prediction App
│   │   ├── model.pkl             # Trained Logistic Regression model
│   │   ├── views.py              # Prediction API & validation
│   │   ├── urls.py               # REST & template routes
│   │   └── templates/predictor/  # Django HTML form template
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/                     # React / Vite Frontend
│   ├── src/
│   │   ├── App.jsx               # Form UI, state, API caller
│   │   ├── App.css               # Card & responsive styles
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
├── requirements.txt              # Root Python dependencies
└── .gitignore
```

---

## Running Locally

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 2. Backend Setup (Django)

```bash
# Navigate to backend directory
cd HeartDisease

# Create and activate virtual environment
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env from template
cp .env.example .env

# Run database migrations
python manage.py migrate

# Start the Django development server
python manage.py runserver 127.0.0.1:8000
```
Backend will be live at `http://127.0.0.1:8000/`.

### 3. Frontend Setup (React / Vite)

```bash
# In a new terminal, navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Create .env from template
cp .env.example .env

# Start the Vite development server
npm run dev
```
Open `http://127.0.0.1:5173/` in your browser.

---

## API Endpoints

### `POST /api/predict/`
Accepts patient clinical indicators and returns risk prediction.

**Payload:**
```json
{
  "age": 63,
  "sex": 1,
  "cp": 3,
  "trestbps": 145,
  "chol": 233,
  "fbs": 1,
  "restecg": 0,
  "thalach": 150,
  "exang": 0,
  "oldpeak": 2.3,
  "slope": 0,
  "ca": 0,
  "thal": 1
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "prediction": 1,
  "risk_level": "High",
  "risk_percentage": 74.1,
  "probability": 0.7406,
  "probabilities": {
    "healthy": 0.2594,
    "heart_disease": 0.7406
  },
  "message": "⚠️ High Risk of Heart Disease",
  "disclaimer": "This project is for educational purposes only and is not a medical diagnostic tool."
}
```

### `GET /api/health/`
Returns health check status and model verification:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "features": ["age", "sex", "cp", "trestbps", "chol", "fbs", "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal"],
  "model_type": "LogisticRegression"
}
```

---

## Disclaimer

> **Important:** This project is for educational purposes only and is not a medical diagnostic tool.
