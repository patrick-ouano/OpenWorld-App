// nested routes from https://reactrouter.com/en/main/start/tutorial
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import AppLayout from "./components/AppLayout";
import Map from "./pages/Map";
import Badges from "./pages/Badges";
import Profile from "./pages/Profile";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* pages without navbar */}
        <Route path="/" element={<Landing />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* pages with navbar */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="/app/map" replace />} />
          <Route path="map" element={<Map />} />
          <Route path="badges" element={<Badges />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
