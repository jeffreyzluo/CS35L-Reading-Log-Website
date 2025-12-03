// Main search page component
// Allows users to search for books and view results by sending queries to the backend

import React, { useState } from 'react';
import SearchBar from './SearchBar';
import './Search.css';
import '../profile/Profile.css';
import Post from './Post';

function Search() {
  const [results, setResults] = useState([]);
  const [clearSignal, setClearSignal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

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
        const formattedResults = data.map(item => ({
          name: item.title,              
          authors: item.authors,         
          description: item.description,  
          thumbnail: item.thumbnail,      
          volumeId: item.volumeId      
        }));
        setResults(formattedResults);
      })
      .catch(err => {
        console.error('Error fetching search results:', err);
        setResults([]);   // Clear results on error
      });
      console.log("Done!")

  }

  const handleClear = () => {
    setResults([]);
    // bump clearSignal so SearchBar clears its input
    setClearSignal((s) => s + 1);
    // also reset tracked query
    setSearchQuery('');
  };

  return (
    <div className="search-page" style={{ '--search-bg': `url(${process.env.PUBLIC_URL || ''}/facebook-book.png)` }}>
      <div className="profile-header">
        <h1 className="profile-title">Find a Book!</h1>
      </div>
      <div className="search-box">
        <SearchBar onSearch={handleSearch} clearSignal={clearSignal} onQueryChange={setSearchQuery} />
        <button
          type="button"
          className="clear-button"
          onClick={handleClear}
          disabled={results.length === 0 && (!searchQuery || !searchQuery.trim())}
        >
          Clear
        </button>
      </div>

      <div className="results-container">
        {results.length > 0 ? (
          results.map((item, idx) => (
            <div key={idx} style={{ padding: "5px", borderBottom: "1px solid #ccc" }}>
              <h3>{item.name}</h3>
              {item.authors && (
                <p>
                  By: {
                    // Check if it's an array and join it, otherwise display the value (which might be a string)
                    Array.isArray(item.authors) 
                      ? item.authors.join(', ') 
                      : item.authors
                  }
                </p>
              )}

              {item.description && <p>{item.description}</p>}
              {item.thumbnail && <img src={item.thumbnail} alt={item.name} />}
              <Post 
                volumeId={item.volumeId}/>
            </div>
          ))
        ) : (
          <p className="no-results">No results yet</p>
        )}
      </div>
    </div>
  );
}

export default Search;