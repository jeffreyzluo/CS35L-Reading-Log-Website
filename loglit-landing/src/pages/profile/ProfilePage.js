// Import Elements
import "./Profile.css";
import Bio from "./Bio.js";
import Username from "./Username.js";
import ProfilePic from './ProfilePic.js';
import Post from "./Post.js";
import SharedPosts from "./SharedPosts.js";

function Profile() {
  return (
    <div className="profile-page">
      <div className="header">
        <h1 className="container">My Profile</h1>
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

        </div>
      </div>
        <div className="post-main">
          <SharedPosts/>
        </div>
    </div>
  );
}

export default Profile;
