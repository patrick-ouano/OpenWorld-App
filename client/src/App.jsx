import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import AppLayout from "./components/AppLayout";
import Map from "./pages/Map";
import Challenges from "./pages/Challenges";
import Badges from "./pages/Badges";
import Profile from "./pages/Profile";

function App() {
  return (
    <Routes>
        {/* Public pages — no nav bar */}
        <Route path="/" element={<Landing />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* App pages — wrapped in AppLayout (nav bar) */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="/app/map" replace />} />
          <Route path="map" element={<Map />} />
          <Route path="challenges" element={<Challenges />} />
          <Route path="badges" element={<Badges />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
  );
}

export default App;
