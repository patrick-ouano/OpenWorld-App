import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import AppLayout from "./components/AppLayout";
import MapPage from "./pages/MapPage";
import Challenges from "./pages/Challenges";
import Badges from "./pages/Badges";
import Profile from "./pages/Profile";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public pages — no nav bar */}
        <Route path="/" element={<Landing />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* App pages — wrapped in AppLayout (nav bar) */}
        <Route path="/app" element={<AppLayout />}>
          <Route path="map" element={<MapPage />} />
          <Route path="challenges" element={<Challenges />} />
          <Route path="badges" element={<Badges />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
