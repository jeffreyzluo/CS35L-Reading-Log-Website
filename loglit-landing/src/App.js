import "./App.css";
import { useNavigate, Routes, Route } from 'react-router-dom';
import Login from "./pages/Login.js";
import Profile from "./pages/profile/ProfilePage.js";
import Search from "./pages/search/SearchPage.js";

function Header() {
  const navigate = useNavigate();
  const handleButtonClick = (destination) => {
        navigate(destination);
      };
  return (
    <header className="header">
      <div className="container">
        <h1 className="logo" onClick={() => handleButtonClick('/')}>LogLit</h1>
        <nav>
          <button className="signup-button" onClick={() => handleButtonClick('/login')}>Login/Sign Up</button>
          <button className="profile-button" onClick={() => handleButtonClick('/profile')}>Profile</button>
          <button className="search-button" onClick={() => handleButtonClick('/search')}>Search</button>                
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  const navigate = useNavigate();
  const handleGetStarted = () => {
    const token = localStorage.getItem('authToken');
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
      <Hero />
    </div>
  );
}

function App() {
  const navigate = useNavigate();

  const handleLogin = async ({ email, password }) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const body = await res.json();
      if (!res.ok) {
        // show simple alert; Login component can be extended to show inline errors
        alert(body.error || 'Login failed');
        return;
      }

      // Save token and navigate to profile
      if (body.token) {
        localStorage.setItem('authToken', body.token);
        navigate('/profile');
      }
    } catch (err) {
      console.error('Login error', err);
      alert('Login error');
    }
  };

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login onSubmit={handleLogin} />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/search" element={<Search />} />
      </Routes>
    </>
  );
}

export default App;