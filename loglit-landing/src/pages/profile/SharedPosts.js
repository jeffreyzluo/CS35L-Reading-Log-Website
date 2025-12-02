import React, { useEffect, useState } from 'react';

function SharedPosts() {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/user_books', {
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
  }, []);
  

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
          <button className="deletePost" onClick={() => handleDeleteClick(post.book_id)}>
            Delete
          </button>
        </li>
        ))}
      </ul>
      </div>
    </div>
  );
}


export default SharedPosts;