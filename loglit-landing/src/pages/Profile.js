import React, { useState } from 'react';

function Profile() {
	// Bio feature state
	const [bio, setBio] = useState('');
	const [isEditingBio, setIsEditingBio] = useState(true);

	// Profile pic & username feature state
  const [profilePic, setProfilePic] = useState(null);
  const [username, setUser] = useState("");
  const [isEditingUsername, setIsEditingUsername] = useState(true);
	
	// --- Bio Handelers ---
	const handleSaveClick = () => { 
		setIsEditingBio(false);
	};
	const handleUpdateClick = () => {
		setIsEditingBio(true);
	};

	// --- Username Handlers ---
	const usernameChange = (event) => {
    setUser(event.target.value);
  };
  const toggleEditingUsername = () => {
    setIsEditingUsername(!isEditingUsername);
  };

	// --- Profile Pic Handler ---
	const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageURL = URL.createObjectURL(file);
      setProfilePic(imageURL);
    }
  };

	let usernameSection;
  if (isEditingUsername) {
  	usernameSection = (
      <div className='username-edit'>
        <input
          type='text'
          value={username}
          onChange={usernameChange}
          placeholder='Enter your username'
          className='username-input'
        />
        <button onClick={toggleEditingUsername} 
          className='save-button'>Save</button>
      </div>
    );
  } else {
    	usernameSection = (
        <div className='username-display'>
          <h2>{username || "Anonymous User"}</h2>
          <button onClick={toggleEditingUsername}
             className='edit-button'>Edit</button>
        </div>
      );
  }
	return (
		<div className="profile-container">
			<h1>My Profile</h1>
			<p>This is your profile page.</p>

			{/*Profile picture section */}
			<div className='profile-container'> </div>
				<div className='profilePic-section'>
					<img src={profilePic || "https://cdn-icons-png.flaticon.com/512/847/847969.png"}
						alt="Profile"
						className='profile-pic'
					/>
					<label htmlFor='profile-upload'
						className='upload-button'>
							Edit Photo
					</label>
					<input 
						id='profile-upload'
						type='file'
						accept='image/*'
						onChange={handleImageUpload}
						style={{display: "none"}}
					/>
				</div>
			<div>

				{/* Username section*/}
        <div className='username-section'>
            {usernameSection}
        </div>

				{/* Bio Section */}
				<div className="input-bio">
					{isEditingBio ? (
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
		</div>
	);

}

// Helper function to implement BIO

export default Profile;