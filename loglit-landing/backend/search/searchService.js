const axios = require('axios'); 

// Service function to fetch books from Google Books API
async function fetchBooks(query) {
  try {
    console.log('--- BACKEND DEBUG: 1. Entering fetchBooks ---');
    // ... API URL construction ...
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${apiKey}`;

    console.log('--- BACKEND DEBUG: 2. Calling Google API ---');

    // Make GET request
    const response = await axios.get(url, { timeout: 5000 });

    console.log('--- BACKEND DEBUG: 3. Google API responded ---');


    // ... Organize results ...
    const results = response.data.items?.map(book => ({
      title: book.volumeInfo.title || 'No title',
      authors: book.volumeInfo.authors || 'Unknown author',
      description: book.volumeInfo.description || 'No description',
      thumbnail: book.volumeInfo.imageLinks?.thumbnail || null
    })) || [];

    console.log('--- BACKEND DEBUG: 4. Returning results ---');

    // Returns to controller
    return results;
  } catch (err) {
    // 💡 CRASH FIX: Log the error safely and set the correct status
    console.error('--- CRITICAL GOOGLE API ERROR DETAILS ---');
    
    // Check if the error has a response (i.e., it's a 403, 400, etc.)
    if (err.response) {
        console.error('Status:', err.response.status);
        console.error('Google Error Data:', err.response.data); // This shows the reason!
    } else {
        // Log a non-response error (e.g., network issue before connection)
        console.error('Network Error:', err.message);
    }
    
    // Log the full stack trace for detailed debugging
    console.error(err.stack);
    console.error('-------------------------------------------');

    // Create a new error with a status code to prevent server crash
    const newError = new Error('Failed to fetch books from Google Books API.');
    // Preserve the status code (e.g., 403) or default to 500
    newError.status = err.response ? err.response.status : 500; 
    
    throw newError;
  }
}


module.exports = { fetchBooks };