import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import api from '../../services/api';

// DisplayFriends
// Shows followers/following lists and provides an autocomplete to add friends.

function DisplayFriends({ username: profileUsername, canEdit }) {
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [activeTab, setActiveTab] = useState('followers'); // 'followers' or 'following'
  const [isLoading, setIsLoading] = useState(true);
  
  // Search/add friend state
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAddingFriend, setIsAddingFriend] = useState(false);

  const navigate = useNavigate();
  const goToProfile = (username) => {
    navigate(`/profile/${username}`);
  };

  // Fetch followers and following lists on component mount
  useEffect(() => {
    const fetchFriendsData = async () => {
      try {
        const followersData = await api.users.getFollowers(profileUsername);
        setFollowers(followersData.followers || []);

        const followingData = await api.users.getFollowing(profileUsername);
        setFollowing(followingData.following || []);
      } catch (err) {
      } finally {
        setIsLoading(false);
      }
    };

    fetchFriendsData();
  }, [profileUsername]);

  // Search for users as user types (autocomplete)
  useEffect(() => {
    const searchUsers = async () => {
      if (searchTerm.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const data = await api.search.searchUsers(searchTerm);
        // Filter out users already being followed and current user
        const filtered = (data.users || []).filter(user =>
          user !== searchTerm &&
          !following.includes(user)
        );
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } catch (err) {
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, following]);

  // Handle adding a friend
  const handleAddFriend = async (usernameToAdd = null) => {
    const friendUsername = usernameToAdd || searchTerm.trim();
    
    if (!friendUsername) {
      alert('Please enter a username');
      return;
    }

    setIsAddingFriend(true);
    try {
      await api.users.addFriend(friendUsername);

      // Refresh the following list for the current profile user
      const followingData = await api.users.getFollowing(profileUsername);
      setFollowing(followingData.following || []);

      // Clear search
      setSearchTerm('');
      setSuggestions([]);
      setShowSuggestions(false);
      alert(`Successfully added ${friendUsername} as a friend!`);
    } catch (err) {
      alert(err.message || 'Failed to add friend');
    } finally {
      setIsAddingFriend(false);
    }
  };

  const handleSuggestionClick = (username) => {
    setSearchTerm(username);
    setShowSuggestions(false);
    handleAddFriend(username);
  };

  if (isLoading) {
    return (
      <div className="friends-section">
        <p>Loading friends...</p>
      </div>
    );
  }

  return (
    <div className="friends-section">
      
      {/* Search and Add Friend Section */}
      {canEdit && (
        <>
        <h2>Friends</h2>
        
        <div style={{ marginBottom: '20px', position: 'relative' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              placeholder="Find friend via username"
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            />
            <button
              onClick={() => handleAddFriend()}
              disabled={isAddingFriend || !searchTerm.trim()}
              style={{
                padding: '10px 20px',
                backgroundColor: isAddingFriend || !searchTerm.trim() ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: isAddingFriend || !searchTerm.trim() ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              {isAddingFriend ? 'Adding...' : 'Add Friend'}
            </button>
          </div>
          
          {/* Autocomplete suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: '120px',
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '5px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              zIndex: 1000,
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  style={{
                    padding: '10px',
                    cursor: 'pointer',
                    borderBottom: index < suggestions.length - 1 ? '1px solid #eee' : 'none'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
        </>
      )}
      
      {/* Tabs to switch between Followers and Following */}
      <div className="friends-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #ddd' }}>
        <button
          className={`friends-tab ${activeTab === 'followers' ? 'active' : ''}`}
          onClick={() => setActiveTab('followers')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'followers' ? '#007bff' : 'transparent',
            color: activeTab === 'followers' ? 'white' : '#333',
            cursor: 'pointer',
            borderBottom: activeTab === 'followers' ? '2px solid #007bff' : 'none',
            marginBottom: '-2px'
          }}
        >
          Followers ({followers.length})
        </button>
        <button
          className={`friends-tab ${activeTab === 'following' ? 'active' : ''}`}
          onClick={() => setActiveTab('following')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'following' ? '#007bff' : 'transparent',
            color: activeTab === 'following' ? 'white' : '#333',
            cursor: 'pointer',
            borderBottom: activeTab === 'following' ? '2px solid #007bff' : 'none',
            marginBottom: '-2px'
          }}
        >
          Following ({following.length})
        </button>
      </div>

      {/* Display list based on active tab */}
      <div className="friends-list">
        {activeTab === 'followers' ? (
          <div>
            {followers.length === 0 ? (
              <p style={{ color: '#666', fontStyle: 'italic' }}>No followers yet.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {followers.map((follower, index) => (
                  <li 
                    key={index}
                    style={{
                      padding: '10px',
                      marginBottom: '8px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '5px',
                      border: '1px solid #ddd'
                    }}
                    onClick={() => goToProfile(follower)}
                  >
                    {follower}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div>
            {following.length === 0 ? (
              <p style={{ color: '#666', fontStyle: 'italic' }}>You're not following anyone yet.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {following.map((followedUser, index) => (
                  <li 
                    key={index}
                    style={{
                      padding: '10px',
                      marginBottom: '8px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '5px',
                      border: '1px solid #ddd'
                    }}
                    onClick={() => goToProfile(followedUser)}
                  >
                    {followedUser}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DisplayFriends;

