import React, { useState, useEffect } from 'react';

function Username( {username: initialUsername} ) {
	// Username feature state
	const [username, setUsername] = useState(initialUsername || '');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  
	// --- Username Handlers ---
  const handleChange = (e) => setUsername(e.target.value);
  const toggleEditingUsername = () => setIsEditingUsername(!isEditingUsername);

  useEffect(() => {
    setUsername(initialUsername || '');
  }, [initialUsername]);


  const usernameSection = isEditingUsername ? (
    <div className="username-edit">
      <input
        type="text"
        value={username}
        onChange={handleChange}
        placeholder="Enter your username"
        className="username-input"
      />
      <button onClick={toggleEditingUsername} className="save-button">
        Save
      </button>
    </div>
  ) : (
    <div className="username-display">
      <h2>{username || 'Anonymous User'}</h2>
      <button onClick={toggleEditingUsername} className="edit-button">
        Edit
      </button>
    </div>
  );

	return (
		<div className="username-section">{usernameSection}</div>
	);
}

export default Username;