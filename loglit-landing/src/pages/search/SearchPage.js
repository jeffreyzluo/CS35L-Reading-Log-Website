import React, { useState } from 'react';
import SearchBar from './SearchBar';
import Post from '../profile/Post';


function Search() {
  const [results, setResults] = useState([]);

  function handleSearch(query) {
    console.log("Searching for...", query)

    // Fetch results from backend
    fetch(`http://localhost:3001/api/search?q=${encodeURIComponent(query)}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        // Map the API response
        const formattedResults = data.map(item => ({
          name: item.title,              // title
          authors: item.authors,         // author
          description: item.description, // description
          thumbnail: item.thumbnail,      // thumbnail (optional)
          isbn: item.isbn                 // isbn
        }));
        setResults(formattedResults);
      })
      .catch(err => {
        console.error('Error fetching search results:', err);
        setResults([]); // clear results on error
      });
      console.log("Done!")

  }

  return (
    <div className="search-page">
      <div className="header">
        <h1 className="container">Find a Book!</h1>
      </div>
      <div className="search-box">
          <SearchBar onSearch={handleSearch}/>
      </div>
      <div>
        {results.length > 0 ? (
          results.map((item, idx) => (
            <div key={idx} style={{ padding: "5px", borderBottom: "1px solid #ccc" }}>
              <h3>{item.name}</h3>
              {item.isbn && <p>ISBN: {item.isbn}</p>}
              {item.authors && (
                <p>
                  By: {
                    // Check if it's an array and join it, otherwise just display the value (which might be a string)
                    Array.isArray(item.authors) 
                      ? item.authors.join(', ') 
                      : item.authors
                  }
                </p>
              )}

              {item.description && <p>{item.description}</p>}
              {item.thumbnail && <img src={item.thumbnail} alt={item.name} />}
              <Post 
                title={item.name} 
                isbn={item.isbn}
                author={
                  Array.isArray(item.authors) 
                    ? item.authors.join(", ") 
                    : item.authors
                }
              />   {/* ← included inside each result */}
            </div>
          ))
        ) : (
          <p>No results yet</p>
        )
        }</div>
    </div>
  );
}

export default Search;