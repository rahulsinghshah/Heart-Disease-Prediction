import { useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

// Initial blank form values
const initialFormState = {
  age: '',
  sex: '',
  cp: '',
  trestbps: '',
  chol: '',
  fbs: '',
  restecg: '',
  thalach: '',
  exang: '',
  oldpeak: '',
  slope: '',
  ca: '',
  thal: '',
}

// Sample presets for quick testing (from Kaggle dataset)
const SAMPLES = {
  highRisk: {
    age: '63',
    sex: '1',
    cp: '3',
    trestbps: '145',
    chol: '233',
    fbs: '1',
    restecg: '0',
    thalach: '150',
    exang: '0',
    oldpeak: '2.3',
    slope: '0',
    ca: '0',
    thal: '1',
  },
  lowRisk: {
    age: '30',
    sex: '0',
    cp: '0',
    trestbps: '110',
    chol: '180',
    fbs: '0',
    restecg: '0',
    thalach: '120',
    exang: '1',
    oldpeak: '3.0',
    slope: '1',
    ca: '2',
    thal: '2',
  },
}

export default function App() {
  const [formData, setFormData] = useState(initialFormState)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const loadPreset = (presetKey) => {
    setFormData(SAMPLES[presetKey])
    setResult(null)
    setError(null)
  }

  const resetForm = () => {
    setFormData(initialFormState)
    setResult(null)
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setResult(null)

    // Check for empty fields
    const emptyFields = Object.keys(formData).filter((key) => formData[key] === '')
    if (emptyFields.length > 0) {
      setError('Please fill in all 13 medical indicators before predicting.')
      return
    }

    setLoading(true)

    // Prepare numeric payload with exact feature keys
    const payload = {
      age: parseFloat(formData.age),
      sex: parseInt(formData.sex, 10),
      cp: parseInt(formData.cp, 10),
      trestbps: parseFloat(formData.trestbps),
      chol: parseFloat(formData.chol),
      fbs: parseInt(formData.fbs, 10),
      restecg: parseInt(formData.restecg, 10),
      thalach: parseFloat(formData.thalach),
      exang: parseInt(formData.exang, 10),
      oldpeak: parseFloat(formData.oldpeak),
      slope: parseInt(formData.slope, 10),
      ca: parseInt(formData.ca, 10),
      thal: parseInt(formData.thal, 10),
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/predict/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Server responded with status ${response.status}`)
      }

      if (data.status === 'success') {
        setResult(data)
      } else {
        throw new Error(data.error || 'Failed to generate prediction.')
      }
    } catch (err) {
      setError(err.message || 'Unable to reach prediction backend. Please ensure the Django server is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2 className="card-title">Heart Disease Predictor</h2>
      <p className="card-subtitle">
        Enter cardiovascular clinical indicators to assess heart disease risk with Logistic Regression.
      </p>

      {/* Quick Test Presets */}
      <div className="quick-samples">
        <span className="sample-tag">Quick Test:</span>
        <button
          type="button"
          className="sample-btn"
          onClick={() => loadPreset('highRisk')}
          disabled={loading}
        >
          High-Risk Sample
        </button>
        <button
          type="button"
          className="sample-btn"
          onClick={() => loadPreset('lowRisk')}
          disabled={loading}
        >
          Low-Risk Sample
        </button>
        <button
          type="button"
          className="sample-btn"
          onClick={resetForm}
          disabled={loading}
        >
          Reset
        </button>
      </div>

      <form onSubmit={handleSubmit} id="predict-form">
        <div className="form-grid">
          {/* 1. Age */}
          <div className="field-group">
            <label className="field-label" htmlFor="age">Age</label>
            <input
              type="number"
              id="age"
              name="age"
              className="form-input"
              placeholder="e.g. 55"
              min="1"
              max="120"
              value={formData.age}
              onChange={handleChange}
              required
            />
          </div>

          {/* 2. Sex */}
          <div className="field-group">
            <label className="field-label" htmlFor="sex">Sex</label>
            <select
              id="sex"
              name="sex"
              className="form-select"
              value={formData.sex}
              onChange={handleChange}
              required
            >
              <option value="">Select Sex</option>
              <option value="1">Male</option>
              <option value="0">Female</option>
            </select>
          </div>

          {/* 3. Chest Pain Type (cp) */}
          <div className="field-group">
            <label className="field-label" htmlFor="cp">Chest Pain Type</label>
            <select
              id="cp"
              name="cp"
              className="form-select"
              value={formData.cp}
              onChange={handleChange}
              required
            >
              <option value="">Select Chest Pain</option>
              <option value="0">0 - Typical Angina</option>
              <option value="1">1 - Atypical Angina</option>
              <option value="2">2 - Non-anginal Pain</option>
              <option value="3">3 - Asymptomatic</option>
            </select>
          </div>

          {/* 4. Resting Blood Pressure (trestbps) */}
          <div className="field-group">
            <label className="field-label" htmlFor="trestbps">Resting BP (trestbps)</label>
            <input
              type="number"
              id="trestbps"
              name="trestbps"
              className="form-input"
              placeholder="mm Hg (e.g. 130)"
              min="50"
              max="300"
              value={formData.trestbps}
              onChange={handleChange}
              required
            />
          </div>

          {/* 5. Cholesterol (chol) */}
          <div className="field-group">
            <label className="field-label" htmlFor="chol">Cholesterol (chol)</label>
            <input
              type="number"
              id="chol"
              name="chol"
              className="form-input"
              placeholder="mg/dl (e.g. 240)"
              min="50"
              max="700"
              value={formData.chol}
              onChange={handleChange}
              required
            />
          </div>

          {/* 6. Fasting Blood Sugar (fbs) */}
          <div className="field-group">
            <label className="field-label" htmlFor="fbs">Fasting Blood Sugar</label>
            <select
              id="fbs"
              name="fbs"
              className="form-select"
              value={formData.fbs}
              onChange={handleChange}
              required
            >
              <option value="">Select Sugar Level</option>
              <option value="1">&gt; 120 mg/dL (High)</option>
              <option value="0">&le; 120 mg/dL (Normal)</option>
            </select>
          </div>

          {/* 7. Resting ECG (restecg) */}
          <div className="field-group">
            <label className="field-label" htmlFor="restecg">Resting ECG</label>
            <select
              id="restecg"
              name="restecg"
              className="form-select"
              value={formData.restecg}
              onChange={handleChange}
              required
            >
              <option value="">Select Resting ECG</option>
              <option value="0">0 - Normal</option>
              <option value="1">1 - ST-T Abnormality</option>
              <option value="2">2 - Left Ventricular Hypertrophy</option>
            </select>
          </div>

          {/* 8. Max Heart Rate (thalach) */}
          <div className="field-group">
            <label className="field-label" htmlFor="thalach">Max Heart Rate (thalach)</label>
            <input
              type="number"
              id="thalach"
              name="thalach"
              className="form-input"
              placeholder="bpm (e.g. 150)"
              min="50"
              max="250"
              value={formData.thalach}
              onChange={handleChange}
              required
            />
          </div>

          {/* 9. Exercise Induced Angina (exang) */}
          <div className="field-group">
            <label className="field-label" htmlFor="exang">Exercise Angina (exang)</label>
            <select
              id="exang"
              name="exang"
              className="form-select"
              value={formData.exang}
              onChange={handleChange}
              required
            >
              <option value="">Exercise Angina?</option>
              <option value="1">Yes</option>
              <option value="0">No</option>
            </select>
          </div>

          {/* 10. ST Depression (oldpeak) */}
          <div className="field-group">
            <label className="field-label" htmlFor="oldpeak">ST Depression (oldpeak)</label>
            <input
              type="number"
              id="oldpeak"
              name="oldpeak"
              step="0.1"
              className="form-input"
              placeholder="e.g. 1.5"
              min="0"
              max="10"
              value={formData.oldpeak}
              onChange={handleChange}
              required
            />
          </div>

          {/* 11. Slope of Peak ST (slope) */}
          <div className="field-group">
            <label className="field-label" htmlFor="slope">Slope of Peak ST</label>
            <select
              id="slope"
              name="slope"
              className="form-select"
              value={formData.slope}
              onChange={handleChange}
              required
            >
              <option value="">Select Slope</option>
              <option value="0">0 - Upsloping</option>
              <option value="1">1 - Flat</option>
              <option value="2">2 - Downsloping</option>
            </select>
          </div>

          {/* 12. Major Vessels (ca) */}
          <div className="field-group">
            <label className="field-label" htmlFor="ca">Major Vessels (ca)</label>
            <select
              id="ca"
              name="ca"
              className="form-select"
              value={formData.ca}
              onChange={handleChange}
              required
            >
              <option value="">Number of Vessels</option>
              <option value="0">0</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </div>

          {/* 13. Thalassemia (thal) */}
          <div className="field-group full-width">
            <label className="field-label" htmlFor="thal">Thalassemia Type</label>
            <select
              id="thal"
              name="thal"
              className="form-select"
              value={formData.thal}
              onChange={handleChange}
              required
            >
              <option value="">Select Thalassemia</option>
              <option value="0">0 - Normal</option>
              <option value="1">1 - Fixed Defect</option>
              <option value="2">2 - Reversible Defect</option>
            </select>
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading} id="submit-btn">
          {loading ? (
            <>
              <span className="spinner" />
              <span>Analyzing Clinical Indicators...</span>
            </>
          ) : (
            <span>Predict Risk</span>
          )}
        </button>
      </form>

      {/* Error Banner */}
      {error && (
        <div className="error-banner" role="alert">
          ⚠️ <strong>Error:</strong> {error}
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div
          className={`result-box ${result.prediction === 1 ? 'high-risk' : 'low-risk'}`}
          role="status"
        >
          <div className="result-header">
            <span>{result.message}</span>
            {result.risk_percentage !== undefined && (
              <span>{result.risk_percentage}% Risk</span>
            )}
          </div>
          {result.probabilities && (
            <div className="result-probability">
              Disease Probability: {(result.probabilities.heart_disease * 100).toFixed(1)}% | Healthy Probability: {(result.probabilities.healthy * 100).toFixed(1)}%
            </div>
          )}
          <div className="result-details">
            Model: Logistic Regression (scikit-learn) &bull; Status: {result.risk_level} Risk Assessment
          </div>
        </div>
      )}

      {/* Medical Disclaimer */}
      <p className="disclaimer">
        This project is for educational purposes only and is not a medical diagnostic tool.
      </p>
    </div>
  )
}
