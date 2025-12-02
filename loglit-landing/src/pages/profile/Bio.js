import React, { useState, useEffect } from 'react';

function Bio() {
	// Bio feature state
	const [bio, setBio] = useState('');
	const [isEditingBio, setIsEditingBio] = useState(false); // Start in view mode
	const [username, setUsername] = useState('');
	const [isLoading, setIsLoading] = useState(true);

	// Fetch username and bio on component mount
	useEffect(() => {
		const fetchUserData = async () => {
			try {
				// Fetch username
				const usernameResponse = await fetch('http://localhost:3001/api/protected', {
					method: 'GET',
					credentials: 'include',
				});
				
				if (!usernameResponse.ok) {
					throw new Error('Failed to fetch username');
				}
				
				const usernameData = await usernameResponse.json();
				setUsername(usernameData.username);

				// Fetch description/bio
				const descriptionResponse = await fetch('http://localhost:3001/api/user/description', {
					method: 'GET',
					credentials: 'include',
				});
				
				if (descriptionResponse.ok) {
					const descriptionData = await descriptionResponse.json();
					console.log('Fetched description:', descriptionData); // Debug log
					setBio(descriptionData.description || '');
				} else {
					const errorData = await descriptionResponse.json().catch(() => ({}));
					console.error('Failed to fetch description:', errorData);
				}
			} catch (err) {
				console.error('Error fetching user data:', err);
			} finally {
				setIsLoading(false);
			}
		};

		fetchUserData();
	}, []);

	// --- Bio Handlers ---
	const handleSaveClick = async () => {
		if (!username) return;
		
		try {
			const response = await fetch('http://localhost:3001/api/user/description', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ description: bio })
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to update description');
			}

			const result = await response.json();
			console.log('Saved description result:', result); // Debug log
			// Update local state with the saved description
			setBio(result.description || bio);
			setIsEditingBio(false);
		} catch (err) {
			console.error('Error updating description:', err);
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
      {isEditingBio ? (
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