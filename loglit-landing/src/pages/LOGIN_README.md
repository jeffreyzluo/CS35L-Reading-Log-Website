# Login Component

A simple, accessible login form component built using Test-Driven Development (TDD).

## Features

- ✅ Email and password input fields
- ✅ Client-side validation
- ✅ Email format validation
- ✅ Required field validation
- ✅ User-friendly error messages
- ✅ Fully tested with 10 passing tests
- ✅ Accessible form with proper labels
- ✅ Responsive design

## Testing

Run the tests with:

```bash
npm test -- Login.test.js
```

## Usage

```jsx
import Login from './pages/Login';

function App() {
  const handleLogin = (credentials) => {
    console.log('Login submitted:', credentials);
    // Handle login logic here (e.g., API call)
  };

  return <Login onSubmit={handleLogin} />;
}
```

## Component Props

- `onSubmit` (optional): Callback function that receives `{ email, password }` when form is valid

## Validation Rules

1. Email is required
2. Email must be in valid format (e.g., user@example.com)
3. Password is required

## TDD Approach

This component was built following Test-Driven Development:

1. **Red Phase**: Wrote 10 comprehensive tests first
   - Form rendering tests
   - User interaction tests
   - Validation tests
   - Submission behavior tests

2. **Green Phase**: Implemented the component to pass all tests
   - Created Login component with state management
   - Added validation logic
   - Implemented error handling

3. **Refactor Phase**: Clean, maintainable code
   - Proper component structure
   - Reusable validation functions
   - Styled with CSS for good UX
