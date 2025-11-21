import React, { useState } from 'react';

function Post({title, author}) {
  // Post feature state
  const [readStatus, setReadStatus] = useState('');
  const [review, setReview] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [booksAdded, setBooksAdded] = useState([]);


  // --- Post Handlers ---
  const handleReviewClick = () => setIsReviewing(true);

  const handleShareClick = () => {
    if (!review.trim()) return;

    const newBook = {
      title: title,
      author: author,
      dateAdded: new Date().toDateString(),
      status: readStatus,
      text: review.trim(),
      rating: "RATING"
    };

    setBooksAdded([newBook, ...booksAdded]);

    // --- Reset Inputs ---
    setReview('');
    setReadStatus("Select status");
    // ... TODO: Update for STAR RATING SYSTEM
    setIsReviewing(false);

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
              <div>{post.dateAdded}</div>
              <div>{post.status}</div>
              <div>{post.text}</div>
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