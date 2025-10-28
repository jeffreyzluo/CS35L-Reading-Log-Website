import React, { useState } from 'react';

function ProfilePic() {
  // Profile pic & username feature state
  const [profilePic, setProfilePic] = useState(null);

  // --- Profile Pic Handler ---
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setProfilePic(URL.createObjectURL(file));
    }
  };
  
  return (
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
  )

}

export default ProfilePic;