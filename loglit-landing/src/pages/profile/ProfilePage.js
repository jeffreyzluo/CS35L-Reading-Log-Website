// Profile page
// Shows a user's profile including username, bio, friends, and shared posts
import "./Profile.css";
import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import Bio from "./Bio.js";
import Username from "./Username.js";
import SharedPosts from "./SharedPosts.js";
import DisplayFriends from "./DisplayFriends.js";
import api from '../../services/api';

function Profile() {
  const [profileUser, setProfileUser] = useState({});
  const [loggedInUser, setLoggedInUser] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const { username: paramUsername } = useParams();


  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch logged-in user (via service)
    api.users.getMe()
      .then(data => setLoggedInUser(data))
      .catch(() => {});

      setProfileUser({});

    // Fetch profile user (via service)
    if (paramUsername) {
      api.users.getUser(paramUsername).then(data => setProfileUser(data)).catch(() => {});
    } else {
      api.users.getMe().then(data => setProfileUser(data)).catch(() => {});
    }
  }, [token, paramUsername, navigate]);

  const canEdit = profileUser.username && loggedInUser.username && profileUser.username === loggedInUser.username;

  return (
    <div
      className="profile-page"
      style={{
        "--profile-bg": `url(${process.env.PUBLIC_URL || ''}/home.jpg)`
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
          <div style={{ marginBottom: 12 }}>
            <input
              aria-label="Search shared posts"
              placeholder="Search posts by title or author"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '8px 10px', width: '100%', maxWidth: 420, borderRadius: 6, border: '1px solid #ccc' }}
            />
          </div>
          <SharedPosts username={profileUser.username} canEdit={canEdit} query={searchQuery} />
        </div>
    </div>
  );
}

export default Profile;
