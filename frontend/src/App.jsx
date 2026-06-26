import { BrowserRouter, Routes, Route } from "react-router-dom";

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
          element={<Cosmetics />}
        />

        <Route
          path="/skincare"
          element={<Skincare />}
        />

        <Route
          path="/palette"
          element={<Palette />}
        />

        <Route
          path="/shopping"
          element={<Shopping />}
        />

        <Route
          path="/expiry"
          element={<Expiry />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;