import React, { useEffect, useState } from 'react';

function SharedPosts() {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/user_books', {
          method: 'GET',
          credentials: 'include', // sends JWT cookie
        });
        const data = await response.json();
  
        if (!response.ok) throw new Error(data.error || 'Failed to fetch books');
  
        console.log('Fetched books:', data);  // <-- sanity check in browser console
        setBooks(data);                        // <-- save to state
      } catch (err) {
        console.error('Error fetching books:', err);
      }
    };
  
    fetchBooks();
  }, []);

  const handleDeleteClick = (id) => {
    console.log("Delete book with ID:", id);

  };

  return(
    <div className="post-Section">
      {/* Shared Posts */}
      <div>
      <ul className="sharedPost">
        {books.map((post) => (
        <li key={post.bookId}>
          <div>{post.bookId}</div>
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