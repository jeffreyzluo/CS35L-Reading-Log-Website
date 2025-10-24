import React, { useState } from 'react';

function Profile() {
	const [bio, setBio] = useState('');
	const [isEditing, setIsEditing] = useState(true);

	// Helper functions to toggle editing mode.
	const handleSaveClick = () => { 
		setIsEditing(false);
	};
	const handleUpdateClick = () => {
		setIsEditing(true);
	};

	return (
		<div>
			<h1>My Profile</h1>
			<p>This is your profile page.</p>

			<div className="input-bio">
				{isEditing ? (
					<> 
						<input 
							type="text" 
							value={bio} 
							onChange={(e) => setBio(e.target.value)} 
							placeholder="Tell us about yourself...">
						</input>
						<button onClick={handleSaveClick}>Save</button>
					</>
				) : (
					<>
						<p>{bio || "No bio yet."}</p>
						<button onClick={handleUpdateClick}>Update</button>
					</>
				)}
			</div>
						
		</div>
	);
}

// Helper function to implement BIO

export default Profile;