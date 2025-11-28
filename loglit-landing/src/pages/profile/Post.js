import React, { useState } from 'react';

function Post({title, author, isbn}) {
  // Post feature state
  const [readStatus, setReadStatus] = useState('');
  const [review, setReview] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [booksAdded, setBooksAdded] = useState([]);


  // --- Post Handlers ---
  const handleReviewClick = () => setIsReviewing(true);

  const handleShareClick = async () => {
    if (!review.trim()) return;

    const newBook = {
      title: title,
      author: author,
      status: readStatus,
      review: review.trim(),
      rating: "RATING"
    };

    try {
      // Send POST request to backend
      const response = await fetch("http://localhost:3001/api/books/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          bookId: isbn,
          rating: 5,        // placeholder for rating
          review: review.trim(),
          status: readStatus,
          added_at: new Date().toISOString()
        })
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || "Failed to add book");
      }
      

      setBooksAdded([data, ...booksAdded]);

      // --- Reset Inputs ---
      setReview('');
      setReadStatus('');
      // ... TODO: Update for STAR RATING SYSTEM
      setIsReviewing(false);
    } catch (err) {
      console.error("Error adding book: ", err);
      alert(err.message);
    }

  };

  const handleTestSession = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/me', {
        method: 'GET',
        credentials: 'include', // send the JWT cookie
      });
      const data = await response.json();
      console.log('Current logged-in user (frontend):', data);
      // backend will also print the user in terminal
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  };

  const handleDeleteClick = (id) => {
    setBooksAdded(booksAdded.filter((booksAdded) => booksAdded.id !== id));

  };
  

  return(
    <div className="post-Section">
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
        {/* --- Test button --- */}
          <button
          style={{ marginTop: '10px', backgroundColor: '#eee', padding: '5px 10px' }}
          onClick={handleTestSession}>Test Session</button>

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

      {/* Shared Posts */}
      <div>
        <ul className="sharedPost">
          {booksAdded.map((post) => (
            <li key={post.id}>
              <div>{post.title}</div>
              <div>{post.author}</div>
              <div>{post.date_added}</div>
              <div>{post.status}</div>
              <div>{post.review}</div>
              <button className="deletePost" onClick={() => handleDeleteClick(post.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}


export default Post;