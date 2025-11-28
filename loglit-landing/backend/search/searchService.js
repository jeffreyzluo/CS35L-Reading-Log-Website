import axios from 'axios';

// Service function to fetch books from Google Books API
export async function fetchBooks(query) {
  try {
    console.log('--- BACKEND DEBUG: 1. Entering fetchBooks ---');
    // ... API URL construction ...
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${apiKey}`;

    console.log('--- BACKEND DEBUG: 2. Calling Google API ---');

    // Make GET request
    const response = await axios.get(url, { timeout: 5000 });

    console.log('--- BACKEND DEBUG: 3. Google API responded ---');


    // Organize results
    const results = response.data.items
    ?.filter(book => {
      const ids = book.volumeInfo?.industryIdentifiers;
      if (!ids) return false; // no identifiers at all

      // Keep only books with ISBN_13 or ISBN_10
      return ids.some(id =>
        id.type === "ISBN_13" || id.type === "ISBN_10"
      );
    })
    ?.reduce((acc, book) => {
      const ids = book.volumeInfo.industryIdentifiers;
      const isbnObj = ids.find(id =>
        id.type === "ISBN_13" || id.type === "ISBN_10"
      );
  
      const isbn = isbnObj?.identifier;
      if (!isbn) return acc;
  
      // If we've already added this ISBN, skip it
      if (acc.isbnSet.has(isbn)) return acc;
  
      // Mark it as seen, and push the book
      acc.isbnSet.add(isbn);
      acc.list.push(book);
      return acc;
    }, { isbnSet: new Set(), list: [] })
    .list
    ?.map(book => ({
      title: book.volumeInfo.title || 'No title',
      authors: book.volumeInfo.authors || 'Unknown author',
      description: book.volumeInfo.description || 'No description',
      thumbnail: book.volumeInfo.imageLinks?.thumbnail || null,
      isbn: book.volumeInfo.industryIdentifiers?.find(
        id => id.type === "ISBN_13" || id.type === "ISBN_10"
      )?.identifier || null
    })) || [];

    console.log('--- BACKEND DEBUG: 4. Returning results ---');

    
    // Returns to controller
    return results;
  } catch (err) {
    console.error('--- GOOGLE API ERROR DETAILS ---');

    // Check error response
    if (err.response) {
        console.error('Status:', err.response.status);
        console.error('Google Error Data:', err.response.data); // This shows the reason!
    } else {
        // Log a non-response error
        console.error('Network Error:', err.message);
    }
    
    // Log the full stack trace for debugging
    console.error(err.stack);

    // New error with status code to prevent server crash
    const newError = new Error('Failed to fetch books from Google Books API.');
    // Preserve status code or default to 500
    newError.status = err.response ? err.response.status : 500; 
    
    throw newError;
  }
}
