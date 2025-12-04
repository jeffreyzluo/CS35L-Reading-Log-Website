import React, { useState, useEffect } from 'react';
import api from '../../services/api';

// Bio
// Displays and allows editing of a user's short profile description.
function Bio( {username: profileUsername, canEdit} ) {
	// Bio feature state
	const [bio, setBio] = useState('');
	const [isEditingBio, setIsEditingBio] = useState(false); // Start in view mode
	const [isLoading, setIsLoading] = useState(true);

	// Fetch bio on component mount
	useEffect(() => {
    if (!profileUsername) return;

		const fetchUserData = async () => {
			try {
				// Get user details (service returns public info including description)
				const userDetails = await api.users.getUser(profileUsername);
				setBio(userDetails?.description || '');
			} catch (err) {
			} finally {
				setIsLoading(false);
			}
		};

		fetchUserData();
	}, [profileUsername]);

	// --- Bio Handlers ---
	const handleSaveClick = async () => {
		if (!profileUsername) return;
		
		try {
			const result = await api.users.updateDescription(bio);
			setBio(result.description || bio);
			setIsEditingBio(false);
		} catch (err) {
			alert(err.message || 'Failed to save bio');
		}
	};

	const handleUpdateClick = () => {
		setIsEditingBio(true);
	};

	if (isLoading) {
		return (
			<div className="bio-section">
				<p>Loading...</p>
			</div>
		);
	}

	return (
		<div className="bio-section">
      {canEdit && isEditingBio ? (
        <>
          <input
            className="input-bio"
            type="text"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="Tell us about yourself..."
          />
          <button className="bio-button" onClick={handleSaveClick}>
            Save
          </button>
        </>
      ) : (
        <>
          <p>{bio || "No bio yet."}</p>
          {canEdit && (
            <button className="bio-button" onClick={handleUpdateClick}>
              Update
            </button>
          )}
        </>
      )}
    	</div>
	);
}

export default Bio;