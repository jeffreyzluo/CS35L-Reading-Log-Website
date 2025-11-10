import React, { useState } from 'react';

function Post() {
  // Post feature state
  const[input, setInput] = useState('');
  const [posts, setPosts] = useState([]);
  const [rating, setRating] = useState('');

  // --- Post Handlers ---
  const handleShareClick = () => {
    if (!input.trim()) return;

    const newPost = {
      id: Date.now(),
      text: input.trim(),
      timestamp: new Date().toDateString(),
      rating: rating ? Number(rating) : null,
    };

    setPosts([newPost, ...posts]);
    setInput('');
    setRating('');
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
        <input 
          type='number'
          min='1'
          max='5'
          value={rating}
          onChange={(event) => setRating(event.target.value)}
          placeholder='Rate 1-5'
          style={{width: '10%'}}
        />
        
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