import React, { useState } from 'react';

function Bio() {
	// Bio feature state
	const [bio, setBio] = useState('');
	const [isEditingBio, setIsEditingBio] = useState(true);

	// --- Bio Handlers ---
	const handleSaveClick = () => setIsEditingBio(false);
	const handleUpdateClick = () => setIsEditingBio(true);

	return (
		<div className="bio-section">
      {isEditingBio ? (
        <>
          <input
            className="input-bio"
            type="text"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
          />
          <button className="bio-button" onClick={handleSaveClick}>
            Save
          </button>
        </>
      ) : (
        <>
          <p>{bio || 'No bio yet.'}</p>
          <button className="bio-button" onClick={handleUpdateClick}>
            Update
          </button>
        </>
      )}
    	</div>
	);

}

export default Bio;
