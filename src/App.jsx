import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Admin from './pages/Admin';
import PrayersList from './pages/PrayersList';
import SinglePrayer from './pages/SinglePrayer';
import Announcements from './pages/Announcements';
import SingleAnnouncement from './pages/SingleAnnouncement';
import Activities from './pages/Activities';
import SingleActivity from './pages/SingleActivity';
import Articles from './pages/Articles';
import SingleArticle from './pages/SingleArticle';
import About from './pages/About';

function AnimatedRoutes({ theme, setTheme }) {
  const location = useLocation();

  return (
    <div key={location.pathname} className="flex-1 animate-page-transition">
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin setTheme={setTheme} />} />
        <Route path="/prayers" element={<PrayersList />} />
        <Route path="/prayers/:id" element={<SinglePrayer />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/announcements/:id" element={<SingleAnnouncement />} />
        <Route path="/activities" element={<Activities />} />
        <Route path="/activities/:id" element={<SingleActivity />} />
        <Route path="/articles" element={<Articles />} />
        <Route path="/articles/:id" element={<SingleArticle />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState('normal');

  // اعمال تم
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // تنظیم داینامیک لوگوی تب مرورگر (Favicon)
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'logo'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().url) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = docSnap.data().url;
      }
    });
    return () => unsub();
  }, []);

  return (
    <Router>
      <div className="min-h-screen text-theme-text bg-theme-bg font-sans transition-colors duration-500 flex flex-col relative">
        <style>{`
          @keyframes pageFadeIn {
            from { opacity: 0; }
            to { opacity: 1; transform: none; } 
          }
          .animate-page-transition {
            animation: pageFadeIn 0.4s ease-out forwards;
          }
          html { scroll-behavior: smooth; }
        `}</style>

        <Navbar theme={theme} setTheme={setTheme} />
        <AnimatedRoutes theme={theme} setTheme={setTheme} />
      </div>
    </Router>
  );
}