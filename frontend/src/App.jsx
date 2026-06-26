import { BrowserRouter, Routes, Route } from "react-router-dom";

import AuthGuard from "./components/AuthGuard";

import Home from "./pages/Home";
import Cosmetics from "./pages/Cosmetics";
import Expiry from "./pages/Expiry";
import Palette from "./pages/Palette";
import Shopping from "./pages/Shopping";
import Skincare from "./pages/Skincare";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Home />} />

        <Route
          path="/cosmetics"
          element={
            <AuthGuard>
              <Cosmetics />
            </AuthGuard>
          }
        />

        <Route
          path="/skincare"
          element={
            <AuthGuard>
              <Skincare />
            </AuthGuard>
          }
        />

        <Route
          path="/palette"
          element={
            <AuthGuard>
              <Palette />
            </AuthGuard>
          }
        />

        <Route
          path="/shopping"
          element={
            <AuthGuard>
              <Shopping />
            </AuthGuard>
          }
        />

        <Route
          path="/expiry"
          element={
            <AuthGuard>
              <Expiry />
            </AuthGuard>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;