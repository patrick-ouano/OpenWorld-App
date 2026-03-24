import './Home.css';
import { useNavigate } from 'react-router-dom';

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="home">
      <h1 className="home-title">OpenWorld</h1>
      <p className="home-subtitle">
        Explore the Swamp. Crack the trivia. Collect your badges.
      </p>
      <button className="home-button" onClick={() => navigate('/signup')}>
        Get Started
      </button>
    </div>
  );
}

export default Landing;
