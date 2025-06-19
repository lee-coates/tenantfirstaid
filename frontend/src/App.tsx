import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Chat from "./Chat";
import About from "./About";
import SessionContextProvider from "./contexts/SessionContext";
import Navbar from "./pages/Chat/components/Navbar";
import Disclaimer from "./Disclaimer";

export default function App() {
  return (
    <SessionContextProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Chat />} />
          <Route path="/about" element={<About />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
        </Routes>
      </Router>
    </SessionContextProvider>
  );
}
