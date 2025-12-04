import axios from 'axios';

/**
 * Service function to fetch books from Google Books API.
 * Returns an array of simplified book objects.
 * @param {string} query
 * @returns {Promise<Array<{title:string,authors:string[],description:string,thumbnail:string|null,volumeId:string|null}>>}
 */
export async function fetchBooks(query) {
  try {
    // API URL construction
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${apiKey}`;
    // Make GET request
    const response = await axios.get(url, { timeout: 5000 });


    // Organize results (ensure `authors` is always an array)
    const results = response.data.items
    ?.map(book => ({
      title: book.volumeInfo.title || 'No title',
      authors: Array.isArray(book.volumeInfo.authors) ? book.volumeInfo.authors : ['Unknown author'],
      description: book.volumeInfo.description || 'No description',
      thumbnail: book.volumeInfo.imageLinks?.thumbnail || null,
      volumeId: book.id || null,
    })) || [];

    // Returns to controller
    return results;
  } catch (err) {
    // Create a sanitized error for the caller; preserve HTTP status if present
    const newError = new Error('Failed to fetch books from Google Books API.');
    // Preserve status code or default to 500
    newError.status = err.response ? err.response.status : 500; 
    
    throw newError;
  }
}
