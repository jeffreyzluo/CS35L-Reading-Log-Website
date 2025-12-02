import React, { useEffect, useState } from 'react';

function SharedPosts({ username: profileUsername, canEdit }) {
  const [books, setBooks] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState(null);

  useEffect(() => {
    if (!profileUsername) return;

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
              };
            } catch {
              return {
                ...book,
                title: 'Unknown title',
                author: 'Unknown author',
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
        <li key={post.book_id}>
          <div>{post.title}</div>
          <div>{post.author || 'Unknown author'}</div>
          <div>{new Date(post.added_at).toLocaleString()}</div>
          <div>{post.status}</div>
          <div>{post.rating}</div>
          <div>{post.review}</div>
          {canEdit && (
            <button className="deletePost" onClick={() => handleDeleteClick(post.book_id)}>
              Delete
            </button>
          )}
        </li>
        ))}
      </ul>
      </div>
    </div>
  );
}


export default SharedPosts;