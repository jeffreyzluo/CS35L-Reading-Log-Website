// Import Elements
import "./Profile.css";
import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import Bio from "./Bio.js";
import Username from "./Username.js";
import SharedPosts from "./SharedPosts.js";

function Profile() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);
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
          <Username/>

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
