import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

// دریافت پروپ‌های theme و setTheme از App.jsx برای تغییر حالت شب و روز
export default function Navbar({ theme, setTheme }) {
  const [isOpen, setIsOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const location = useLocation();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'logo'), (docSnap) => {
      if (docSnap.exists()) setLogoUrl(docSnap.data().url || '');
    });
    return () => unsub();
  }, []);

  const links = [
    { path: '/', label: 'صفحه اصلی' },
    { path: '/announcements', label: 'اطلاعیه‌ها' },
    { path: '/activities', label: 'برنامه‌ها' },
    { path: '/articles', label: 'مقالات' },
    { path: '/prayers', label: 'ادعیه' },
    { path: '/about', label: 'تماس با ما' },
  ];

  // تابع تغییر حالت شب و روز (بین تم روشن و تیره سایت)
  const toggleTheme = () => {
    setTheme(theme === 'mourning' ? 'normal' : 'mourning');
  };

  return (
    // اضافه کردن dir="rtl" برای راست‌چین شدن کامل منو
    <nav className="bg-theme-primary text-white shadow-md relative z-50" dir="rtl">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16 md:h-20">
          
          {/* بخش سمت راست: لوگو و نام سایت */}
          <Link to="/" className="flex items-center gap-3 group">
            {logoUrl ? (
              // فیلتر brightness(0) invert(1) لوگوی رنگی را کاملا سفید و تک‌رنگ می‌کند
              <img src={logoUrl} alt="Logo" className="w-10 h-10 md:w-12 md:h-12 object-contain transition-transform group-hover:scale-105" style={{ filter: 'brightness(0) invert(1)' }} />
            ) : (
              <svg className="w-8 h-8 text-theme-accent" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L8 6v3H4v13h16V9h-4V6l-4-4zm0 2.8l2 2V9h-4V6.8l2-2zM6 11h3v9H6v-9zm12 0v9h-3v-9h3zM10 11h4v4h-4v-4zm0 6h4v3h-4v-3z"/></svg>
            )}
            <span className="font-bold text-base md:text-xl hidden sm:block text-theme-accent tracking-wide">مسجد جامع حضرت خدیجه کبری (س)</span>
          </Link>

          {/* بخش وسط: منوی دسکتاپ */}
          <div className="hidden md:flex items-center gap-6">
            {links.map(link => (
              <Link key={link.path} to={link.path} className={`text-sm font-bold hover:text-theme-accent transition-colors ${location.pathname === link.path ? 'text-theme-accent border-b-2 border-theme-accent pb-1' : 'text-white'}`}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* بخش سمت چپ: آیکون‌های تم، ادمین و منوی همبرگری موبایل */}
          <div className="flex items-center gap-4 md:gap-5">
            
            {/* دکمه تغییر حالت شب و روز */}
            <button onClick={toggleTheme} className="text-white hover:text-theme-accent transition-colors focus:outline-none" title="تغییر حالت شب/روز">
              {theme === 'mourning' ? (
                // آیکون خورشید (برای برگشت به حالت روز)
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                // آیکون ماه (برای رفتن به حالت شب/تاریک)
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>

            {/* دکمه ورود به پنل ادمین */}
            <Link to="/admin" className="text-white hover:text-theme-accent transition-colors" title="ورود به پنل مدیریت">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </Link>

            {/* دکمه منوی موبایل */}
            <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-white hover:text-theme-accent focus:outline-none">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>

        </div>
      </div>

      {/* منوی بازشوی موبایل */}
      {isOpen && (
        <div className="md:hidden bg-theme-primary border-t border-white border-opacity-10 absolute w-full left-0 top-[100%] shadow-xl animate-fade-in">
          <div className="px-4 py-3 space-y-2">
            {links.map(link => (
              <Link key={link.path} to={link.path} onClick={() => setIsOpen(false)} className={`block py-3 px-2 text-sm font-bold rounded-lg ${location.pathname === link.path ? 'bg-theme-accent bg-opacity-20 text-theme-accent' : 'text-white hover:bg-white hover:bg-opacity-5'}`}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}