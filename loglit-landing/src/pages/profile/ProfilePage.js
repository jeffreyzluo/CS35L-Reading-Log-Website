// Import Elements
import "./Profile.css";
import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import Bio from "./Bio.js";
import Username from "./Username.js";
import SharedPosts from "./SharedPosts.js";
import DisplayFriends from "./displayFriends.js";

function Profile() {
  const [profileUser, setProfileUser] = useState({});
  const [loggedInUser, setLoggedInUser] = useState({});
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const { username: paramUsername } = useParams();


  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch logged-in user
    fetch('/api/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setLoggedInUser(data))
      .catch(err => console.error('Failed to fetch logged-in user:', err));

      setProfileUser({});

    // Fetch profile user
    const url = paramUsername ? `/api/users/${paramUsername}` : '/api/me';
    fetch(url, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setProfileUser(data))
      .catch(err => console.error('Failed to fetch profile:', err));
  }, [token, paramUsername, navigate]);

  const canEdit = profileUser.username && loggedInUser.username && profileUser.username === loggedInUser.username;

  return (
    <div
      className="profile-page"
      style={{
        ['--profile-bg']: `url(${process.env.PUBLIC_URL || ''}/home.jpg)`
      }}
    >
      <div className="profile-header">
        <h1 className="profile-title">My Profile</h1>
      </div>
      <div className="profile-main">
        {/* Main content: username + bio */}
        <div className="profile-content" style={{ width: '100%' }}>

          {/* Username section */}
          <Username username={profileUser.username} canEdit={canEdit} />

          {/* Bio Section */}
          <Bio username={profileUser.username} canEdit={canEdit} />

          {/* Recommendation is available in SharedPosts list below */}
        </div>
      </div>
      
      {/* Friends Section */}
      <div className="friends-main">
        <DisplayFriends username={profileUser.username} canEdit={canEdit} />
      </div>
      
        <div className="post-main">
          <SharedPosts username={profileUser.username} canEdit={canEdit} />
        </div>
    </div>
  );
}

export default Profile;
