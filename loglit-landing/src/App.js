import "./App.css";
import { useNavigate, Routes, Route } from 'react-router-dom';
import Login from "./pages/Login.js";

function Header() {
  const navigate = useNavigate();
  const handleButtonClick = () => {
        navigate('/login');
      };
  return (
    <header className="header">
      <div className="container">
        <h1 className="logo">LogLit</h1>
        <nav>
          <button className="signup-button" onClick={handleButtonClick}>Login/Sign Up</button>
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
    </Routes>
  );
}

export default App;