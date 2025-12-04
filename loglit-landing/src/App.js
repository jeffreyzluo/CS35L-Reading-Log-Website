import "./App.css";
import { useNavigate, Routes, Route } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './AuthContext';
import Login from "./pages/login/Login.js";
import api from './services/api';
import Profile from "./pages/profile/ProfilePage.js";
import Search from "./pages/search/SearchPage.js";
import HeroImage from './components/HeroImage';
import ScrollToTop from './ScrollToTop';

function Header() {
  const navigate = useNavigate();
  const { token, signOut } = useContext(AuthContext);
  const handleButtonClick = (destination) => {
    navigate(destination);
  };
  const handleSignOut = () => {
    signOut();
    navigate('/login');
  };
  return (
    <header className="header">
      <div className="container">
        <h1 className="logo" onClick={() => handleButtonClick('/')}>LogLit</h1>
        <nav>
          {!token && (
            <button className="signup-button" onClick={() => handleButtonClick('/login')}>Login/Sign Up</button>
          )}
          {token && (
            <button className="signup-button" onClick={handleSignOut}>Sign Out</button>
          )}
          <button className="profile-button" onClick={() => handleButtonClick('/profile')}>Profile</button>
          <button className="search-button" onClick={() => handleButtonClick('/search')}>Search</button>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const handleGetStarted = () => {
    if (token) {
      navigate('/search');
    } else {
      navigate('/login');
    }
  };

  return (
    <section className="hero">
      <div className="container">
        <h2>Track Your Reading Journey</h2>
        <p>
          Log your books, track your progress, and discover new reads. LogLit
          makes it easy to keep your reading organized and inspiring.
        </p>
        <button className="cta-button" onClick={handleGetStarted}>Get Started</button>
      </div>
    </section>
  );
}

function Home() {
  return (
    <div className="App">
      <HeroImage>
        <Hero />
      </HeroImage>
    </div>
  );
}

function App() {
  const navigate = useNavigate();
  const { signIn } = useContext(AuthContext);

  const handleLogin = async ({ email, password }) => {
    try {
      const body = await api.auth.login(email, password);
      // Save token via context and navigate to profile
      if (body && body.token) {
        try { signIn(body.token); } catch (_) { try { localStorage.setItem('authToken', body.token); } catch(_){} }
        navigate('/profile');
      }
    } catch (err) {
      alert(err.message || 'Login failed');
    }
  };

  return (
    <>
      <Header />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login onSubmit={handleLogin} />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/search" element={<Search />} />
      </Routes>
    </>
  );
}

export default App;