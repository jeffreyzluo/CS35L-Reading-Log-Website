// Import Elements
import "./Profile.css";
import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import Bio from "./Bio.js";
import Username from "./Username.js";
import SharedPosts from "./SharedPosts.js";

function Profile() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const { username: paramUsername } = useParams();
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch username from session
    fetch('/api/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setUsername(data.username)) // just grab username
      .catch(err => console.error('Failed to fetch user:', err));
  }, [token, navigate]);

  const profileUsername = paramUsername || username;


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
          <Username username={profileUsername} />

          {/* Bio Section */}
          <Bio/>

          {/* Recommendation is available in SharedPosts list below */}
        </div>
      </div>
        <div className="post-main">
          <SharedPosts/>
        </div>
    </div>
  );
}

export default Profile;
