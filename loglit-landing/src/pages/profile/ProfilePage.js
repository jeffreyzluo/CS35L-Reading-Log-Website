// Import Elements
import "./Profile.css";
import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import Bio from "./Bio.js";
import Username from "./Username.js";
import ProfilePic from './ProfilePic.js';
import SharedPosts from "./SharedPosts.js";
import ProfileRecommendation from './ProfileRecommendation';

function Profile() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);
  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1 className="profile-title">My Profile</h1>
      </div>
      <div className="profile-main">
        {/* Profile picture section */}
        <ProfilePic/>

        {/* Right-side content: username + bio */}
        <div className="profile-content">

          {/* Username section */}
          <Username/>

          {/* Bio Section */}
          <Bio/>

          {/* Recommendation button / area */}
          <ProfileRecommendation />
        </div>
      </div>
        <div className="post-main">
          <SharedPosts/>
        </div>
    </div>
  );
}

export default Profile;
