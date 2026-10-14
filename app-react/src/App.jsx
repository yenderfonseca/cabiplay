import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Station from './pages/Station.jsx';
import Credits from './pages/Credits.jsx';
import NotFound from './pages/NotFound.jsx';
import PlayerBar from './components/PlayerBar.jsx';

export default function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/estacion/:slug" element={<Station />} />
        <Route path="/creditos" element={<Credits />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {/* Lives outside <Routes> so audio survives navigation. */}
      <PlayerBar />
    </div>
  );
}
