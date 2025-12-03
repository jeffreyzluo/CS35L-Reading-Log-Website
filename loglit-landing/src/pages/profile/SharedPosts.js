import React, { useEffect, useState } from 'react';
import Notification from '../../components/Notification';

function SharedPosts({ username: profileUsername, canEdit, query = '' }) {
  const [books, setBooks] = useState([]);
  const [sortBy, setSortBy] = useState('date'); // 'date' or 'rating'
  const [sortDir, setSortDir] = useState('desc'); // 'desc' (default newest/highest first) or 'asc'
  const [recommendation, setRecommendation] = useState(null);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (!profileUsername) return;

    // Reset any recommendation state when viewing a different profile
    setRecommendation(null);
    setRecError(null);
    setRecLoading(false);

    const fetchBooks = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/user_books/${profileUsername}`, {
          method: 'GET',
          credentials: 'include',
        });
  
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch books');
  
        // Enrich each book with Google Books info
        const enriched = await Promise.all(
          data.map(async (book) => {
            try {
              const gbRes = await fetch(
                `https://www.googleapis.com/books/v1/volumes/${book.book_id}`
              );
              const gbData = await gbRes.json();
  
              return {
                ...book,
                title: gbData.volumeInfo?.title || 'Unknown title',
                author: gbData.volumeInfo?.authors?.[0] || 'Unknown author',
                thumbnail: gbData.volumeInfo?.imageLinks?.thumbnail || null,
              };
            } catch {
              return {
                ...book,
                title: 'Unknown title',
                author: 'Unknown author',
                thumbnail: null,
              };
            }
          })
        );
  
        setBooks(enriched);
      } catch (err) {
        console.error('Error fetching books:', err);
      }
    };
  
    fetchBooks();
  }, [profileUsername]);

  const handleRecommendClick = async () => {
    setRecError(null);
    setRecommendation(null);
    // Collect titles from the books (use enriched title when available)
    const titles = books.map((b) => b.title).filter(Boolean);
    if (titles.length === 0) {
      setRecError('No book titles available to generate a recommendation');
      return;
    }

    setRecLoading(true);
    try {
      const res = await fetch('/api/recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ titles })
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error || 'Recommendation request failed');
      }

      // Expecting body.recommendation (string) or similar from the server
      setRecommendation(body.recommendation || JSON.stringify(body));
    } catch (err) {
      console.error('Recommendation error:', err);
      setRecError(err.message || 'Recommendation failed');
    } finally {
      setRecLoading(false);
    }
  };
  

  const handleDeleteClick = async (bookId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/books/${bookId}`, {
        method: 'DELETE',
        credentials: 'include', // send JWT cookie
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete book');
      }
  
      console.log('Deleted book:', data);
  
      // Remove the deleted book from local state
      setBooks((prevBooks) => prevBooks.filter((book) => book.book_id !== bookId));
      // Show transient notification (use shared Notification component)
      setNotification({ message: 'Review removed', type: 'error' });
    } catch (err) {
      console.error('Error deleting book:', err);
      alert(err.message);
    }
  };
  

  return(
    <div className="post-Section">
      <div style={{ marginBottom: 12 }}>
        <Notification
          message={notification?.message}
          type={notification?.type}
          onClose={() => setNotification(null)}
        />
        <button className="bio-button" onClick={handleRecommendClick} disabled={recLoading}>
          {recLoading ? 'Getting recommendation...' : 'Get Recommendation'}
        </button>
        <label style={{ marginLeft: 12, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ marginRight: 8 }}>Sort by:</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date">Date added</option>
            <option value="rating">Rating</option>
            <option value="author">Author</option>
            <option value="title">Title</option>
          </select>
          <button
            aria-label={sortDir === 'desc' ? 'Sort descending' : 'Sort ascending'}
            title={sortDir === 'desc' ? 'Descending' : 'Ascending'}
            onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
            style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #ccc', background: '#fff' }}
          >
            {sortDir === 'desc' ? '↓' : '↑'}
          </button>
          <span style={{ marginLeft: 10, fontSize: 13, color: '#333' }}>
            {(() => {
              const dirText = sortDir === 'desc' ? (sortBy === 'rating' || sortBy === 'date' ? 'Newest/Highest first' : 'Z → A') : (sortBy === 'rating' || sortBy === 'date' ? 'Oldest/Lowest first' : 'A → Z');
              const fieldText = sortBy === 'date' ? 'Date' : (sortBy === 'rating' ? 'Rating' : (sortBy === 'author' ? 'Author' : 'Title'));
              return `Sorting: ${fieldText} (${dirText})`;
            })()}
          </span>
        </label>
        {recError && <div style={{ color: 'crimson', marginTop: 8 }}>{recError}</div>}
        {recommendation && (
          <div className="recommendation" style={{ marginTop: 12, padding: 12, background: '#fff', borderRadius: 6 }}>
            <strong>Recommendation:</strong>
            <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{recommendation}</div>
          </div>
        )}
      </div>
      {/* Shared Posts */}
      <div>
      <ul className="sharedPost">
        {(() => {
          const q = (query || '').trim().toLowerCase();
          const filtered = q === '' ? books : books.filter((post) => {
            const title = (post.title || '').toLowerCase();
            const author = (post.author || '').toLowerCase();
            return title.includes(q) || author.includes(q);
          });

          if (filtered.length === 0) {
            return <li key="no-results">No posts match your search.</li>;
          }

          const dir = sortDir === 'asc' ? 1 : -1;
          const sorted = filtered.slice().sort((a, b) => {
            if (sortBy === 'rating') {
              const ra = Number(a.rating) || 0;
              const rb = Number(b.rating) || 0;
              return dir * (ra - rb);
            }

            if (sortBy === 'author') {
              const aa = (a.author || '').toLowerCase();
              const bb = (b.author || '').toLowerCase();
              return dir * aa.localeCompare(bb);
            }

            if (sortBy === 'title') {
              const ta = (a.title || '').toLowerCase();
              const tb = (b.title || '').toLowerCase();
              return dir * ta.localeCompare(tb);
            }

            // default: date
            const ta = a.added_at ? new Date(a.added_at).getTime() : 0;
            const tb = b.added_at ? new Date(b.added_at).getTime() : 0;
            return dir * (ta - tb);
          });

          return sorted.map((post) => (
            <li key={post.book_id} className="postItem">
              <div className="postImage">
                {post.thumbnail && (
                  <img src={post.thumbnail} alt={post.title} className="bookThumbnail" />
                )}
              </div>

              <div className="postContent">
                <div className="postTitle">{post.title}</div>
                <div className="postAuthor">{post.author || 'Unknown author'}</div>
                <div className="postDate">
                  {post.added_at ? new Date(post.added_at).toLocaleString() : ''}
                </div>
                <div className="postStatus">{post.status}</div>
                <div className="postReview">{post.review}</div>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      style={{
                        fontSize: '24px',
                        color: star <= post.rating ? "#FFD700" : "#ccc",
                        WebkitTextStroke: "1px black",
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>
                {canEdit && (
                  <button
                    className="deletePost"
                    onClick={() => handleDeleteClick(post.book_id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ));
        })()}
      </ul>
      </div>
    </div>
  );
}


export default SharedPosts;