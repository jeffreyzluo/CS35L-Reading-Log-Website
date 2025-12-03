// Handles the search input and submission

import React, { useState, useEffect } from "react";

function SearchBar({ onSearch, clearSignal, onQueryChange }) {
  const [query, setQuery] = useState("");

  // When parent increments `clearSignal`, reset the input
  useEffect(() => {
    if (clearSignal != null) {
      setQuery('');
      if (onQueryChange) onQueryChange('');
    }
  }, [clearSignal, onQueryChange]);

  const handleSubmit = (e) => {
    e.preventDefault();     // Prevent page refresh
    if (query.trim()) {
      onSearch(query);      // Send query to parent
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={(e) => {
          const v = e.target.value;
          setQuery(v);
          if (onQueryChange) onQueryChange(v);
        }}
      />
      <button type="submit">Search</button>
    </form>
  );
};

export default SearchBar;
