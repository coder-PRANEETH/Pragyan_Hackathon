import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../styles/UserDashboard.css';   // ✅ Correct import


function formatRiskAnalysis(data) {
  const {
    risk,
    department,
    risk_explanation,
    department_explanation
  } = data;

  // Extract feature names from explanation strings
  const extractFeatures = (text) => {
    const matches = text.match(/([A-Za-z_-]+)\s*\(/g);
    if (!matches) return [];
    return matches.map(m => m.replace(" (", ""));
  };

  const riskFactors = extractFeatures(risk_explanation);
  const deptFactors = extractFeatures(department_explanation);

  const readableNames = {
    Age: "age",
    Heart_Rate: "heart rate",
    Temperature: "body temperature",
    Blood_Pressure: "blood pressure",
    Pre_Existing_Conditions: "existing medical conditions",
    Gender: "gender"
  };

  const convertToReadable = (arr) =>
    arr.map(f => readableNames[f] || f).join(", ");

  const friendlyText = `
🩺 Health Risk Assessment

Overall Risk Level: ${risk}

Based on your medical data and symptoms, your current condition is assessed as ${risk.toLowerCase()}.

The main factors influencing this assessment were:
• ${convertToReadable(riskFactors)}

🏥 Recommended Department: ${department}

You may consider consulting the ${department} department.
This recommendation is mainly influenced by:
• ${convertToReadable(deptFactors)}

 What This Means:
Your vital signs and reported symptoms suggest that monitoring and professional evaluation may be beneficial. If symptoms worsen or new symptoms appear, seek medical attention promptly.
  `.trim();

  return friendlyText;
}


function UserDashboard() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [symptoms, setSymptoms] = useState('');
  const [calculatingRisk, setCalculatingRisk] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  useEffect(() => {
    const userNameFromUrl = searchParams.get('userName');
    if (userNameFromUrl) {
      loadUserData(userNameFromUrl);
    }
  }, [searchParams]);

  const loadUserData = async (name) => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5000/user-details/${encodeURIComponent(name)}`
      );

      if (!response.ok) throw new Error('User not found');

      const data = await response.json();
      setUserData(data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      alert(`Error loading user data: ${error.message}`);
    }
  };

  const medical =
    userData?.medical && userData.medical.length > 0
      ? userData.medical[0]
      : null;

  // Calculate health status
  const getHeartRateStatus = (rate) => {
    if (!rate) return { status: 'N/A', color: 'gray' };
    if (rate < 60) return { status: 'Low', color: 'blue' };
    if (rate > 100) return { status: 'High', color: 'red' };
    return { status: 'Normal', color: 'green' };
  };

  const getTemperatureStatus = (temp) => {
    if (!temp) return { status: 'N/A', color: 'gray' };
    if (temp < 97) return { status: 'Low', color: 'blue' };
    if (temp > 99.5) return { status: 'High', color: 'red' };
    return { status: 'Normal', color: 'green' };
  };

  const getBMICategory = (bmi) => {
    if (!bmi) return { status: 'N/A', color: 'gray' };
    if (bmi < 18.5) return { status: 'Underweight', color: 'blue' };
    if (bmi < 25) return { status: 'Normal', color: 'green' };
    if (bmi < 30) return { status: 'Overweight', color: 'yellow' };
    return { status: 'Obese', color: 'red' };
  };

  const heartRateStatus = getHeartRateStatus(medical?.heart_beat);
  const tempStatus = getTemperatureStatus(medical?.temperature);

  const handleCalculateRisk = async () => {
    if (!symptoms.trim()) {
      alert('Please enter your symptoms');
      return;
    }

    try {
      setCalculatingRisk(true);

      // Prepare medical data
      const medicalData = {
        heart_beat: medical?.heart_beat || 72,
        temperature: medical?.temperature || 98.6,
        blood_group: medical?.blood_group || 'N/A',
        age: userData?.age || 'N/A',
        gender: userData?.gender || 'N/A'
      };

      // Create prompt for the model
      const prompt = `Patient Medical Data:
- Age: ${medicalData.age}
- Gender: ${medicalData.gender}
- Heart Rate: ${medicalData.heart_beat} bpm
- Temperature: ${medicalData.temperature}°F
- Blood Group: ${medicalData.blood_group}

Current Symptoms: ${symptoms}

Based on the above medical data and symptoms, please assess the health risk level (Low, Medium, High, or Critical) and provide a brief explanation.`;

      // Send to backend endpoint (same as chat)
      const response = await fetch('http://localhost:5000/analyze-symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: userData.name,
          symptoms: symptoms,
          medicalData: medicalData,
          prompt: prompt
        })
      });

      const result = await response.json();

      if (response.ok) {
        // Close the symptoms modal
        setShowRiskModal(false);
        setSymptoms('');
        setCalculatingRisk(false);

        // Show the analysis modal with the result
        setAnalysisResult(formatRiskAnalysis(result) || result.response || 'Risk assessment completed');
        setShowAnalysisModal(true);

        // Reload user data to get updated risk
        await loadUserData(userData.name);
      } else {
        alert(`Error: ${result.message || 'Failed to analyze symptoms'}`);
        setCalculatingRisk(false);
      }
    } catch (error) {
      setCalculatingRisk(false);
      alert(`Error calculating risk: ${error.message}`);
    }
  };

  const getRiskColor = (risk) => {
    if (!risk || risk === 'none') return 'gray';
    const riskLower = risk.toLowerCase();
    if (riskLower.includes('low')) return 'green';
    if (riskLower.includes('medium') || riskLower.includes('moderate')) return 'yellow';
    if (riskLower.includes('high')) return 'red';
    if (riskLower.includes('critical')) return 'red';
    return 'gray';
  };

 const handleViewAnalysis = async () => {
  try {
    setLoadingAnalysis(true);
    setShowAnalysisModal(true);
    setAnalysisResult('');

    const medicalData = {
      heart_beat: medical?.heart_beat || 72,
      temperature: medical?.temperature || 98.6,
      blood_group: medical?.blood_group || 'N/A',
      age: userData?.age || 'N/A',
      gender: userData?.gender || 'N/A'
    };

    const lastSymptoms =
      userData?.symptoms && userData.symptoms.length > 0
        ? userData.symptoms[userData.symptoms.length - 1].description
        : 'No symptoms recorded';

    const response = await fetch('http://localhost:5000/analyze-symptoms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: userData.name,
        symptoms: lastSymptoms,
        medicalData: medicalData
      })
    });

    const result = await response.json();

    if (response.ok) {
      const formatted = `
Risk Level: ${result.risk}

Recommended Department: ${result.department}

--- Risk Explanation ---
${result.risk_explanation}

--- Department Explanation ---
${result.department_explanation}
      `;

      setAnalysisResult(formatted);
    } else {
      setAnalysisResult(result.message || 'Failed to generate analysis');
    }

    setLoadingAnalysis(false);
  } catch (error) {
    setLoadingAnalysis(false);
    setAnalysisResult(`Error: ${error.message}`);
  }
};


  return (
    <div className="user-dashboard">


      {/* Hero Section */}
      <section className="hero-card">
        <h1>
          {userData ? `Welcome ${userData.name}!` : 'Welcome to Medical Triage'}
        </h1>
        <p className="subtitle">
          {userData
            ? 'View your health metrics and medical information below'
            : 'Please navigate to a user profile to view dashboard data'}
        </p>

        {userData && (
          <div className="user-info">
            
            
          </div>
        )}
      </section>

      {/* Health Cards */}
      {userData && (
        <>
          <div className="card-grid">
            {/* Risk Assessment Card - First Card */}
            <div className="stat-card risk-card">
              <div className="card-icon">⚠️</div>
              <h3>Health Risk Level</h3>
              {userData.risk && userData.risk !== 'none' ? (
                <>
                  <p className="stat-value">{userData.risk}</p>
                  <div className={`status-badge status-${getRiskColor(userData.risk)}`}>
                    {userData.risk}
                  </div>
                  <div className="risk-buttons">
                    <button
                      className="analysis-btn"
                      onClick={handleViewAnalysis}
                    >
                      📋 View Analysis
                    </button>
                    <button
                      className="recalculate-btn-small"
                      onClick={() => setShowRiskModal(true)}
                    >
                      🔄 Recalculate
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="stat-value">Not Assessed</p>
                  <div className="status-badge status-gray">Unknown</div>
                  <button
                    className="calculate-btn"
                    onClick={() => setShowRiskModal(true)}
                  >
                    Calculate Risk
                  </button>
                </>
              )}
              <div className="card-footer">Based on symptoms & vitals</div>
            </div>

            {/* Heart Rate Card */}
            <div className="stat-card heart-rate-card">
              <div className="card-icon">❤️</div>
              <h3>Heart Rate</h3>
              <p className="stat-value">{medical?.heart_beat || '72'} <span className="unit">bpm</span></p>
              <div className={`status-badge status-${heartRateStatus.color}`}>
                {heartRateStatus.status}
              </div>
              <div className="card-footer">Beats per minute</div>
            </div>

            {/* Temperature Card */}
            <div className="stat-card temperature-card">
              <div className="card-icon">🌡️</div>
              <h3>Body Temperature</h3>
              <p className="stat-value">{medical?.temperature || '98.6'} <span className="unit">°F</span></p>
              <div className={`status-badge status-${tempStatus.color}`}>
                {tempStatus.status}
              </div>
              <div className="card-footer">Normal: 97-99°F</div>
            </div>

            {/* Blood Group Card */}
            <div className="stat-card blood-group-card">
              <div className="card-icon">🩸</div>
              <h3>Blood Group</h3>
              <p className="stat-value">{medical?.blood_group || 'N/A'}</p>
              <div className="status-badge status-info">Blood Type</div>
              <div className="card-footer">Donor compatible</div>
            </div>

            {/* Blood Pressure Card */}
            <div className="stat-card bp-card">
              <div className="card-icon">💉</div>
              <h3>Blood Pressure</h3>
              <p className="stat-value">
                {medical?.bp_systolic || '120'}/{medical?.bp_diastolic || '80'}
                <span className="unit">mmHg</span>
              </p>
              <div className="status-badge status-green">Normal</div>
              <div className="card-footer">Systolic/Diastolic</div>
            </div>

            {/* Oxygen Level Card */}
            <div className="stat-card oxygen-card">
              <div className="card-icon">🫁</div>
              <h3>Oxygen Saturation</h3>
              <p className="stat-value">{medical?.oxygen_level || '98'} <span className="unit">%</span></p>
              <div className="status-badge status-green">Excellent</div>
              <div className="card-footer">SpO2 Level</div>
            </div>

            {/* BMI Card */}
            <div className="stat-card bmi-card">
              <div className="card-icon">⚖️</div>
              <h3>Body Mass Index</h3>
              <p className="stat-value">{medical?.bmi || '22.5'}</p>
              <div className="status-badge status-green">Healthy</div>
              <div className="card-footer">BMI Score</div>
            </div>
          </div>

          {/* Additional Health Metrics */}
          <div className="health-summary">
            <h2 className="section-title">Health Summary</h2>
            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-icon">💪</div>
                <div className="summary-content">
                  <h4>Activity Level</h4>
                  <p className="summary-value">Moderate</p>
                  <span className="summary-desc">8,500 steps today</span>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon">😴</div>
                <div className="summary-content">
                  <h4>Sleep Quality</h4>
                  <p className="summary-value">7.5 hrs</p>
                  <span className="summary-desc">Last night</span>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon">💧</div>
                <div className="summary-content">
                  <h4>Hydration</h4>
                  <p className="summary-value">2.1 L</p>
                  <span className="summary-desc">Today's intake</span>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon">🍎</div>
                <div className="summary-content">
                  <h4>Calories</h4>
                  <p className="summary-value">1,850</p>
                  <span className="summary-desc">Burned today</span>
                </div>
              </div>
            </div>
          </div>

          {/* Health Alerts */}
          <div className="health-alerts">
            <h2 className="section-title">Health Insights</h2>
            <div className="alert-list">
              <div className="alert-item alert-success">
                <span className="alert-icon">✅</span>
                <div className="alert-content">
                  <h4>Great Vital Signs</h4>
                  <p>All your vital signs are within normal range. Keep up the good work!</p>
                </div>
              </div>
              <div className="alert-item alert-info">
                <span className="alert-icon">💡</span>
                <div className="alert-content">
                  <h4>Hydration Reminder</h4>
                  <p>You're slightly below your daily water intake goal. Try to drink 6 more glasses.</p>
                </div>
              </div>
              <div className="alert-item alert-tip">
                <span className="alert-icon">⭐</span>
                <div className="alert-content">
                  <h4>Activity Tip</h4>
                  <p>Consider a 15-minute walk to reach your 10,000 steps goal for today!</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading user data...</p>
        </div>
      )}

      {/* Risk Assessment Modal */}
      {showRiskModal && (
        <div className="modal-overlay" onClick={() => setShowRiskModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Calculate Health Risk</h2>
              <button
                className="modal-close"
                onClick={() => setShowRiskModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Enter your current symptoms to assess your health risk level based on your medical data.
              </p>
              <label htmlFor="symptoms">Symptoms</label>
              <textarea
                id="symptoms"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Describe your symptoms in detail (e.g., fever, headache, cough, fatigue...)"
                rows="6"
                disabled={calculatingRisk}
              />
              <div className="modal-footer">
                <button
                  className="cancel-btn"
                  onClick={() => {
                    setShowRiskModal(false);
                    setSymptoms('');
                  }}
                  disabled={calculatingRisk}
                >
                  Cancel
                </button>
                <button
                  className="submit-btn"
                  onClick={handleCalculateRisk}
                  disabled={calculatingRisk}
                >
                  {calculatingRisk ? (
                    <>
                      <span className="spinner-small"></span>
                      Analyzing...
                    </>
                  ) : (
                    'Calculate Risk'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Risk Analysis Modal */}
      {showAnalysisModal && (
        <div className="modal-overlay" onClick={() => setShowAnalysisModal(false)}>
          <div className="modal-content analysis-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Risk Analysis & Recommendations</h2>
              <button
                className="modal-close"
                onClick={() => setShowAnalysisModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {loadingAnalysis ? (
                <div className="analysis-loading">
                  <div className="spinner"></div>
                  <p>Generating detailed analysis...</p>
                </div>
              ) : (
                <div className="analysis-content">
                  {analysisResult.split('\n').map((line, index) => (
                    <p key={index} className="analysis-line">
                      {line}
                    </p>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="submit-btn"
                onClick={() => setShowAnalysisModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default UserDashboard;
