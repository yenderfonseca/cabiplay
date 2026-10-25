import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Search from './pages/Search.jsx';
import Library from './pages/Library.jsx';
import Station from './pages/Station.jsx';
import Credits from './pages/Credits.jsx';
import NotFound from './pages/NotFound.jsx';
import PlayerBar from './components/PlayerBar.jsx';
import NowPlaying from './components/NowPlaying.jsx';
import TabBar from './components/TabBar.jsx';
import { usePlayer } from './lib/PlayerContext.jsx';

export default function App() {
  const { current } = usePlayer();
  return (
    <div className={`app ${current ? 'has-player' : ''}`}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/buscar" element={<Search />} />
        <Route path="/biblioteca" element={<Library />} />
        <Route path="/estacion/:slug" element={<Station />} />
        <Route path="/creditos" element={<Credits />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {/* Outside <Routes> so audio survives navigation. */}
      <PlayerBar />
      <TabBar />
      <NowPlaying />
    </div>
  );
}
