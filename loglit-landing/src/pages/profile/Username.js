import React, { useState, useEffect } from 'react';

function Username( {username: initialUsername} ) {
	// Username feature state
	const [username, setUser] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
	// Fetch username on component mount
	useEffect(() => {
		const fetchUsername = async () => {
			try {
				const response = await fetch('http://localhost:3001/api/protected', {
					method: 'GET',
					credentials: 'include', // send the JWT cookie
				});
				
				if (!response.ok) {
					throw new Error('Failed to fetch username');
				}
				
				const data = await response.json();
				setUser(data.username);
			} catch (err) {
				console.error('Error fetching username:', err);
			}
		};

		fetchUsername();
	}, []);

	// --- Username Handlers ---
	const usernameChange = (event) => setUser(event.target.value);
  
  const handleSaveUsername = async () => {
    if (!username || username.trim() === '') {
      alert('Username cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/user/username', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newUsername: username.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update username');
      }

      setIsEditingUsername(false);
    } catch (err) {
      console.error('Error updating username:', err);
      alert(err.message || 'Failed to save username');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEditingUsername = () => {
    setIsEditingUsername(!isEditingUsername);
  };

  const usernameSection = isEditingUsername ? (
    <div className="username-edit">
      <input
        type="text"
        value={username}
        onChange={handleChange}
        placeholder="Enter your username"
        className="username-input"
      />
      <button 
        onClick={handleSaveUsername} 
        className="save-button"
        disabled={isLoading}
      >
        {isLoading ? 'Saving...' : 'Save'}
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