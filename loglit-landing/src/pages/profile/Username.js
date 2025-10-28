import React, { useState } from 'react';

function Username() {
	// Username feature state
	const [username, setUser] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(true);
  
	// --- Username Handlers ---
	const usernameChange = (event) => setUser(event.target.value);
  const toggleEditingUsername = () => setIsEditingUsername(!isEditingUsername);

  const usernameSection = isEditingUsername ? (
    <div className="username-edit">
      <input
        type="text"
        value={username}
        onChange={usernameChange}
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