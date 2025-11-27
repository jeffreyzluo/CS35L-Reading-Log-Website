import React, { useState } from 'react';

function Post() {
  // Post feature state
  const[input, setInput] = useState('');
  const [posts, setPosts] = useState([]);
  const [rating, setRating] = useState('');

  // --- Post Handlers ---
  const handleShareClick = () => {
    if (!input.trim() || rating === 0)
    {
      alert("Please enter a post and a rating before sharing.");
      return;
    }

    const newPost = {
      id: Date.now(),
      text: input.trim(),
      timestamp: new Date().toDateString(),
      rating: rating,
    };

    setPosts([newPost, ...posts]);
    setInput('');
    setRating(0);
  };
  const handleDeleteClick = (id) => {
    setPosts(posts.filter((post) => post.id !== id));

  };

  return(
    <div className="post-Section">
      {/* Input Post */}
      <div className="post-Container">
        <textarea 
          className="post-Input" 
          type="text" 
          value={input} 
          onChange={(event) => setInput(event.target.value)}
          placeholder="Share a book!">
        </textarea>
        {/* Rating Section */}
        <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={() => setRating(star)} // Set the rating when a star is clicked
            style={{
              fontSize: '24px',
              cursor: 'pointer',
              color: star <= rating ? '#FFD700' : '#ccc', // Highlight selected stars
            }}
          >
            ★
          </span>
        ))}
      </div>
        
        <button className="postButton" onClick={handleShareClick}>Share</button>
      </div>

      {/* Shared Posts */}
      <div>
        <ul className="sharedPost">
          {posts.map((post) => (
            <li key={post.id}>
              <strong className="post-text-content">{post.text}</strong>
              <small>{post.timestamp}</small>
              {post.rating && <p> Rating: {post.rating}/5</p>}
              <button className="deletePost" onClick={ () => handleDeleteClick(post.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}


export default Post;