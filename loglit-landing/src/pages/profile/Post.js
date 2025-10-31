import React, { useState } from 'react';

function Post() {
  // Post feature state
  const[input, setInput] = useState('');
  const [posts, setPosts] = useState([]);

  // --- Post Handlers ---
  const handleShareClick = () => {
    if (!input.trim()) return;

    const newPost = {
      id: Date.now(),
      text: input.trim(),
      timestamp: new Date().toDateString(),
    };

    setPosts([newPost, ...posts]);
    setInput('');
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
        
        <button className="postButton" onClick={handleShareClick}>Share</button>
      </div>

      {/* Shared Posts */}
      <div>
        <ul className="sharedPost">
          {posts.map((post) => (
            <li key={post.id}>
              <strong className="post-text-content">{post.text}</strong>
              <small>{post.timestamp}</small>
              <button className="deletePost" onClick={ () => handleDeleteClick(post.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}


export default Post;