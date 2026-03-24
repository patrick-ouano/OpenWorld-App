import './Home.css';

function Home({ onEnterApp }) {
  return (
    <div className="home">
      <h1 className="home-title">OpenWorld</h1>
      <p className="home-subtitle">
        Explore the Swamp. Crack the trivia. Collect your badges.
      </p>
      <button className="home-button" onClick={onEnterApp}>
        Start Exploring
      </button>
    </div>
  );
}

export default Home;
