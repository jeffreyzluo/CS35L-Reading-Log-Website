import React, { useState } from 'react';
import SearchBar from './SearchBar';
import './Search.css';
import '../profile/Profile.css';
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
          thumbnail: item.thumbnail      // thumbnail (optional)
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
      <div className="profile-header">
        <h1 className="profile-title">Find a Book!</h1>
      </div>
      <div className="search-box">
        <SearchBar onSearch={handleSearch} />
      </div>

      <div className="results-container">
        {results.length > 0 ? (
          results.map((item, idx) => (
            <div className="result-item" key={idx}>
              {item.thumbnail && (
                <img className="result-thumbnail" src={item.thumbnail} alt={item.name} />
              )}
              <div className="result-meta">
                <h3>{item.name}</h3>
                {item.authors && (
                  <p>By: {Array.isArray(item.authors) ? item.authors.join(', ') : item.authors}</p>
                )}
                {item.description && <p>{item.description}</p>}
                <Post
                  title={item.name}
                  author={Array.isArray(item.authors) ? item.authors.join(', ') : item.authors}
                />
              </div>
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