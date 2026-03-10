import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar({ theme, setTheme }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // تغییر تم بین روز و شب
  const toggleTheme = () => {
    setTheme(theme === 'mourning' ? 'normal' : 'mourning');
  };

  // بستن منو با کلیک در خارج از آن
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { to: "/", label: "صفحه اصلی" },
    { to: "/prayers", label: "ادعیه و زیارات" },
    { to: "/announcements", label: "اطلاعیه‌ها" },
    { to: "/activities", label: "برنامه‌ها" },
    { to: "/articles", label: "مقالات" },
    { to: "/about", label: "درباره و تماس" },
  ];

  return (
    <nav className="bg-theme-surface shadow-md sticky top-0 z-50 border-b border-theme-primary border-opacity-10 transition-colors duration-500">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        
        {/* دکمه همبرگری موبایل */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-theme-primary p-2 focus:outline-none">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        {/* لوگو (آیکون مسجد) */}
        <div className="flex-shrink-0">
          <Link to="/" className="text-theme-primary hover:text-theme-accent transition-colors duration-300" title="صفحه اصلی">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L8 6v3H4v13h16V9h-4V6l-4-4zm0 2.8l2 2V9h-4V6.8l2-2zM6 11h3v9H6v-9zm12 0v9h-3v-9h3zM10 11h4v4h-4v-4zm0 6h4v3h-4v-3z"/>
            </svg>
          </Link>
        </div>
        
        {/* منوی دسکتاپ */}
        <div className="hidden md:flex flex-1 justify-center gap-6 lg:gap-8 font-bold text-sm text-theme-text">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} className="hover:text-theme-accent hover:-translate-y-0.5 transition-all duration-300">{link.label}</Link>
          ))}
        </div>
        
        {/* دکمه‌های کنترلی سمت چپ */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={toggleTheme} className="text-theme-textMuted hover:text-theme-accent hover:rotate-12 transition-all duration-500" title="تغییر حالت شب/روز">
            {theme === 'mourning' ? 
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> : 
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            }
          </button>
          <Link to="/admin" className="bg-theme-primary text-white p-2 rounded-full hover:bg-opacity-80 hover:shadow-lg transition-all shadow-md" title="پنل مدیریت">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </Link>
        </div>

      </div>

      {/* منوی بازشوی موبایل */}
      {isMenuOpen && (
        <div ref={menuRef} className="md:hidden bg-theme-surface border-t border-theme-primary border-opacity-10 absolute w-full shadow-2xl z-50">
          <div className="flex flex-col p-4 gap-3 font-bold text-theme-text text-center">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} onClick={() => setIsMenuOpen(false)} className="hover:text-theme-accent bg-theme-bg py-3 rounded-xl border border-theme-primary border-opacity-5 transition-colors">{link.label}</Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}