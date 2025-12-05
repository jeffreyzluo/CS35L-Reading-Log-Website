import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../AuthContext';
import api from '../../services/api';

// Username display/edit component
// Props:
// - initialUsername: current username to display
// - canEdit: whether the logged-in user can edit this username
function Username( {username: initialUsername, canEdit, onUsernameUpdated} ) {
  // Local editable username state (avoid shadowing prop)
  const [currentUsername, setCurrentUsername] = useState(initialUsername || '');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const authContext = useContext(AuthContext);

  // Keep local state in sync with prop changes
  useEffect(() => {
    setCurrentUsername(initialUsername || '');
  }, [initialUsername]);

  // --- Username Handlers ---
  const handleUsernameChange = (event) => setCurrentUsername(event.target.value);

  const handleSaveUsername = async () => {
    if (!currentUsername || currentUsername.trim() === '') {
      alert('Username cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      const body = await api.users.updateUsername(currentUsername.trim());
      setIsEditingUsername(false);

      // If API returned a token (server refreshed JWT), update client auth state
      if (body && body.token) {
        try {
          // prefer context signIn if available
          if (authContext && typeof authContext.signIn === 'function') {
            authContext.signIn(body.token);
          } else {
            try { localStorage.setItem('authToken', body.token); } catch (e) {}
          }
        } catch (e) {
          // ignore errors updating client token
        }
      }

      // Notify parent that username changed so it can update URL / state
      if (typeof onUsernameUpdated === 'function') {
        onUsernameUpdated(currentUsername.trim());
      }
    } catch (err) {
      alert(err.message || 'Failed to save username');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEditingUsername = () => setIsEditingUsername(!isEditingUsername);

  const usernameSection = isEditingUsername && canEdit ? (
    <div className="username-edit">
      <input
        type="text"
        value={currentUsername}
        onChange={handleUsernameChange}
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
      <h2>{currentUsername || 'Anonymous User'}</h2>
      {canEdit && (
        <button onClick={toggleEditingUsername} className="edit-button">
          Edit
        </button>
      )}
    </div>
  );

  return (
    <div className="username-section">{usernameSection}</div>
  );
}

export default Username;