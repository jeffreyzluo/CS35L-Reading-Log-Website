import "./App.css";
import { useNavigate, Routes, Route } from 'react-router-dom';
import Login from "./pages/Login.js";
import Profile from "./pages/profile/ProfilePage.js";

function Header() {
  const navigate = useNavigate();
  const handleButtonClick = (destination) => {
        navigate(destination);
      };
  return (
    <header className="header">
      <div className="container">
        <h1 className="logo">LogLit</h1>
        <nav>
          <button className="signup-button" onClick={() => handleButtonClick('/Login')}>Login/Sign Up</button>
          <button className="profile-button" onClick={() => handleButtonClick('/Profile')}>Profile</button>        
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <h2>Track Your Reading Journey</h2>
        <p>
          Log your books, track your progress, and discover new reads. LogLit
          makes it easy to keep your reading organized and inspiring.
        </p>
        <button className="cta-button">Get Started</button>
      </div>
    </section>
  );
}

function Home() {
  return (
    <div className="App">
      <Header />
      <Hero />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}

export default App;