import React, { useState } from 'react';

function Profile() {
  // Bio feature state
  const [bio, setBio] = useState('');
  const [isEditingBio, setIsEditingBio] = useState(true);

  // Profile pic & username feature state
  const [profilePic, setProfilePic] = useState(null);
  const [username, setUser] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(true);

  // --- Bio Handlers ---
  const handleSaveClick = () => setIsEditingBio(false);
  const handleUpdateClick = () => setIsEditingBio(true);

  // --- Profile Pic Handler ---
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setProfilePic(URL.createObjectURL(file));
    }
  };

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
    <div className="profile-page">
      <div className="header">
        <h1 className="container">My Profile</h1>
      </div>
      <div className="profile-main">
        {/* Profile picture section */}
        <div className="profilePic-section">
          <img
            src={profilePic || 'https://cdn-icons-png.flaticon.com/512/847/847969.png'}
            alt="Profile"
            className="profile-pic"
          />
          <label htmlFor="profile-upload" className="upload-button">
            Edit Photo
          </label>
          <input
            id="profile-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
        </div>

        {/* Right-side content: username + bio */}
        <div className="profile-content">
          {/* Username section */}
          <div className="username-section">{usernameSection}</div>

          {/* Bio Section */}
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
        </div>
      </div>
    </div>
  );
}

export default Profile;
