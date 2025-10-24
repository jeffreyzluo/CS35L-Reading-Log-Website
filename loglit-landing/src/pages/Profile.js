import React, { useState } from 'react';

function Profile() {
    const [profilePic, setProfilePic] = useState(null);
    const [username, setUser] = useState("");
    const [isEditing, setIsEditing] = useState(true);

    const imageUpload = (event) =>
    {
        const file = event.target.files[0];
        if (file)
        {
            const imageURL = URL.createObjectURL(file);
            setProfilePic(imageURL);
        }
    };

    const usernameChange = (event) =>
    {
        setUser(event.target.value);
    };

    const toggleEditing = () =>
    {
        setIsEditing(!isEditing);
    };

    let usernameSection;
    if (isEditing)
    {
        usernameSection = (
            <div className='username-edit'>
                <input
                    type='text'
                    value={username}
                    onChange={usernameChange}
                    placeholder='Enter your username'
                    className='username-input'
                />
                <button onClick={toggleEditing} 
                className='save-button'>Save</button>
            </div>
        );
    }
    else
    {
        usernameSection = (
            <div className='username-display'>
                <h2>{username || "Anonymous User"}</h2>
                <button onClick={toggleEditing}
                className='edit-button'>Edit</button>
            </div>
        );
    }

    return (
        <div className='profile-container'>
            <h1>My Profile</h1>
            <p>This is your profile page.</p>

            <div className='profilePic-section'>
                <img
                    src={profilePic || "https://cdn-icons-png.flaticon.com/512/847/847969.png"}
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
                    onChange={imageUpload}
                    style={{display: "none"}}
                />
            </div>

        <div className='username-section'>
            {usernameSection}
        </div>
        </div>
    );
}

export default Profile;