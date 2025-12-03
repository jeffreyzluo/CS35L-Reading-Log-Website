import React, { useEffect, useState } from 'react';

function SharedPosts({ username: profileUsername, canEdit }) {
  const [books, setBooks] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState(null);

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
    } catch (err) {
      console.error('Error deleting book:', err);
      alert(err.message);
    }
  };
  

  return(
    <div className="post-Section">
      <div style={{ marginBottom: 12 }}>
        <button className="bio-button" onClick={handleRecommendClick} disabled={recLoading}>
          {recLoading ? 'Getting recommendation...' : 'Get Recommendation'}
        </button>
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
        {books.map((post) => (
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
      {new Date(post.added_at).toLocaleString()}
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

        ))}
      </ul>
      </div>
    </div>
  );
}


export default SharedPosts;