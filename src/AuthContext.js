import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext({ token: null, signIn: () => {}, signOut: () => {} });

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('authToken');
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (token) {
        localStorage.setItem('authToken', token);
      } else {
        localStorage.removeItem('authToken');
      }
    } catch (e) {
      // ignore localStorage errors
    }
  }, [token]);

  const signIn = (newToken) => setToken(newToken);
  const signOut = () => setToken(null);

  return (
    <AuthContext.Provider value={{ token, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
