import React, { useState, useEffect } from 'react';
import './Profile.css';

function DisplayFriends() {
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [activeTab, setActiveTab] = useState('followers'); // 'followers' or 'following'
  const [isLoading, setIsLoading] = useState(true);
  
  // Search/add friend state
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAddingFriend, setIsAddingFriend] = useState(false);

  // Fetch followers and following lists on component mount
  useEffect(() => {
    const fetchFriendsData = async () => {
      try {
        // Fetch followers list
        const followersResponse = await fetch('http://localhost:3001/api/user/followers', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (followersResponse.ok) {
          const followersData = await followersResponse.json();
          setFollowers(followersData.followers || []);
        }

        // Fetch following list
        const followingResponse = await fetch('http://localhost:3001/api/user/following', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (followingResponse.ok) {
          const followingData = await followingResponse.json();
          setFollowing(followingData.following || []);
        }
      } catch (err) {
        console.error('Error fetching friends data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFriendsData();
  }, []);

  // Search for users as user types (autocomplete)
  useEffect(() => {
    const searchUsers = async () => {
      if (searchTerm.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:3001/api/users/search?q=${encodeURIComponent(searchTerm)}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          // Filter out users already being followed and current user
          const filtered = data.users.filter(user => 
            user !== searchTerm && 
            !following.includes(user)
          );
          setSuggestions(filtered);
          setShowSuggestions(filtered.length > 0);
        }
      } catch (err) {
        console.error('Error searching users:', err);
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
      const response = await fetch('http://localhost:3001/api/user/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ friendUsername })
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned an invalid response. Please check your backend server.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add friend');
      }

      // Refresh the following list
      const followingResponse = await fetch('http://localhost:3001/api/user/following', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (followingResponse.ok) {
        const followingData = await followingResponse.json();
        setFollowing(followingData.following || []);
      }

      // Clear search
      setSearchTerm('');
      setSuggestions([]);
      setShowSuggestions(false);
      alert(`Successfully added ${friendUsername} as a friend!`);
    } catch (err) {
      console.error('Error adding friend:', err);
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
      <h2>Friends</h2>
      
      {/* Search and Add Friend Section */}
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

