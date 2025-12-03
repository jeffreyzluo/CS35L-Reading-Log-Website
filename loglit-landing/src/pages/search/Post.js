// Allows users to leave a review, rating, and read status for a book
// Sends this data to the backend to be stored in the database

import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import Notification from '../../components/Notification';

function Post({volumeId}) {
  const [readStatus, setReadStatus] = useState('');
  const [review, setReview] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [rating, setRating] = useState(0);
  const [notification, setNotification] = useState(null);
  
  // Followers/Following state
  // (Removed followers/following counts per design)

  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  // --- Post Handlers ---
  const handleReviewClick = () => {
    if (!token) {
      if (window.confirm('You must be logged in to review. Go to login page?')) {
        navigate('/login');
      }
      return;
    }

    setIsReviewing(true);
  };

  const handleShareClick = async () => {
    if (!token) {
      if (window.confirm('You must be logged in to share a review. Go to login page?')) {
        navigate('/login');
      }
      return;
    }
    if (!review.trim()) return;

    try {
      // Send POST request to backend
      const response = await fetch("http://localhost:3001/api/books/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          book_id: volumeId,
          rating: rating,
          review: review.trim(),
          status: readStatus,
          added_at: new Date().toISOString()
        })
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || "Failed to add book");
      }
      
      // --- Reset Inputs ---
      // Show success notification (Notification component will auto-dismiss)
      setNotification({ message: 'Review added', type: 'success' });

      setReview('');
      setReadStatus('');
      setRating(0);
      setIsReviewing(false);
    } catch (err) {
      console.error("Error adding book: ", err);
      alert(err.message);
    }

  };

  // Notification component handles its own timer and cleanup via onClose

  return(
    <div className="post-Section">
      {/* Followers/Following display removed */}
      <Notification
        message={notification?.message}
        type={notification?.type}
        onClose={() => setNotification(null)}
      />

      {/* Input Post */}
      <div className="post-Container">
        
        {/* Read Status */}
        <select
          value={readStatus}
          onChange={(event) => setReadStatus(event.target.value)}
          className="status-select">
          <option value="">Select status</option>
          <option value="reading">📖 Reading</option>
          <option value="completed">✅ Completed</option>
          <option value="wishlist">⭐ Wishlist</option>
        </select>

        {/* Post Review */}
        {isReviewing ? (
          <>
          <textarea 
            className="post-Review" 
            type="text" 
            value={review} 
            onChange={(event) => setReview(event.target.value)}
            placeholder="Share a book!">
          </textarea>

          {/* Star Rating */}
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                onClick={() => setRating(star)} // Update the rating state
                style={{
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: star <= rating ? "#FFD700" : "#ccc" // Highlight selected stars
                }}
              >
              ★
              </span>
            ))}
          </div>
          <button className="postButton" onClick={handleShareClick}>Share</button>
          </>
        ) : (
          <>
          <button className="post-button" onClick={handleReviewClick}>
            Review
          </button>
        </>
        )}

      </div>
    </div>
  );
}


export default Post;