import React, { useState } from 'react';
import './Profile.css';

function ProfileRecommendation() {
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [error, setError] = useState(null);

  async function handleRecommend() {
    setLoading(true);
    setRecommendation(null);
    setError(null);
    try {
      const resp = await fetch('/api/recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Recommendation failed');
      setRecommendation(data.recommendation || JSON.stringify(data.raw));
    } catch (err) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="recommendation-area">
      <h3>Get a Recommended Book</h3>
      <p className="rec-instructions">Click the button to analyze your books and receive a single recommended title.</p>
      <button className="rec-button" onClick={handleRecommend} disabled={loading}>
        {loading ? 'Thinking...' : 'Get Recommendation'}
      </button>
      {recommendation && (
        <div className="rec-result">
          <strong>Recommendation:</strong> <span className="rec-title">{recommendation}</span>
        </div>
      )}
      {error && (
        <div className="rec-error">Error: {error}</div>
      )}
    </div>
  );
}

export default ProfileRecommendation;
