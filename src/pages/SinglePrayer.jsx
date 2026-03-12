import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom'; 
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useParams, Link } from 'react-router-dom';

export default function SinglePrayer() {
  const { id } = useParams();
  const [prayer, setPrayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(0.5); 
  const [showArabic, setShowArabic] = useState(true); 
  const [showTranslation, setShowTranslation] = useState(false); 
  const [arabicFont, setArabicFont] = useState('default'); 
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // ابزارهای دسکتاپ و موبایل
  const [activeTool, setActiveTool] = useState(null); // برای دسکتاپ: 'search' | 'jump' | null
  const [mobilePopup, setMobilePopup] = useState(null); // برای موبایل: 'search' | 'jump' | null
  
  const [searchQuery, setSearchQuery] = useState('');
  const [jumpNumber, setJumpNumber] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  
  const [jumpError, setJumpError] = useState('');
  const [searchError, setSearchError] = useState('');

  const wakeLockRef = useRef(null);
  const accumulatedScroll = useRef(0);
  const stanzaRefs = useRef([]); 

  useEffect(() => {
    setMounted(true);
    const fetchPrayer = async () => {
      const docSnap = await getDoc(doc(db, "prayers", id));
      if (docSnap.exists()) {
        const fetchedPrayer = { id: docSnap.id, ...docSnap.data() };
        setPrayer(fetchedPrayer);
        document.title = `متن کامل ${fetchedPrayer.title} همراه با ترجمه | مسجد حضرت خدیجه کبرا`;
      }
      setLoading(false);
    };
    fetchPrayer();
  }, [id]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => alert("امکان تمام صفحه وجود ندارد."));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false));
      }
    }
  };

  const formatArabicText = (text) => {
    if (!text) return null;
    return text;
  };

  const scrollToStanza = (index) => {
    if (stanzaRefs.current[index]) {
      const y = stanzaRefs.current[index].getBoundingClientRect().top + window.pageYOffset - 140; 
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // ----- منطق پرش (با حل باگ اعداد فارسی/عربی) -----
  const handleJump = () => {
    if (!jumpNumber) return;
    
    // تبدیل تمام ارقام فارسی و عربی به انگلیسی
    const persianDigits = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
    const arabicDigits  = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
    let engNum = jumpNumber;
    for (let i = 0; i < 10; i++) {
      engNum = engNum.split(persianDigits[i]).join(i).split(arabicDigits[i]).join(i);
    }
    
    const num = parseInt(engNum, 10);
    
    if (num > 0 && num <= prayer.content.length) {
      scrollToStanza(num - 1);
      setActiveTool(null);
      setMobilePopup(null);
      setJumpNumber('');
      setJumpError('');
    } else {
      const err = `شماره فراز باید بین ۱ تا ${prayer.content.length} باشد.`;
      setJumpError(err);
      if (!mobilePopup) alert(err); // برای دسکتاپ
    }
  };

  // ----- منطق جستجو (با قابلیت حذف اعراب) -----
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    const results = [];
    const removeDiacritics = (str) => str ? str.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '') : '';
    const searchVal = removeDiacritics(searchQuery);

    prayer.content.forEach((stanza, idx) => {
      if (
        (showArabic && stanza.a && removeDiacritics(stanza.a).includes(searchVal)) || 
        (showTranslation && stanza.p && removeDiacritics(stanza.p).includes(searchVal))
      ) {
        results.push(idx);
      }
    });

    setSearchResults(results);
    if (results.length > 0) {
      setCurrentSearchIndex(0);
      scrollToStanza(results[0]);
      setMobilePopup(null);
      setSearchError('');
    } else {
      setCurrentSearchIndex(-1);
      const err = 'موردی یافت نشد.';
      setSearchError(err);
      if (!mobilePopup) alert(err);
    }
  };

  const nextResult = () => {
    if (searchResults.length === 0) return;
    const nextIdx = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIdx);
    scrollToStanza(searchResults[nextIdx]);
  };

  const prevResult = () => {
    if (searchResults.length === 0) return;
    const prevIdx = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentSearchIndex(prevIdx);
    scrollToStanza(searchResults[prevIdx]);
  };

  const onSearchChange = (e) => {
    const val = e.target.value.replace(/[^آ-یأ-ي\s\u200C]/g, '');
    setSearchQuery(val);
    setSearchError('');
  };

  const onJumpChange = (e) => {
    const val = e.target.value.replace(/[^0-9۰-۹٠-٩]/g, '');
    setJumpNumber(val);
    setJumpError('');
  };

  // ----- اسکرول خودکار -----
  useEffect(() => {
    const manageWakeLock = async () => {
      if (isAutoScrolling && 'wakeLock' in navigator) {
        try { wakeLockRef.current = await navigator.wakeLock.request('screen'); } catch (err) { console.log(err); }
      } else if (!isAutoScrolling && wakeLockRef.current) {
        wakeLockRef.current.release(); wakeLockRef.current = null;
      }
    };
    manageWakeLock();

    let animationFrameId;
    const scrollStep = () => {
      if (isAutoScrolling) {
        accumulatedScroll.current += scrollSpeed;
        if (accumulatedScroll.current >= 1) {
          const pixelsToScroll = Math.floor(accumulatedScroll.current);
          window.scrollBy(0, pixelsToScroll);
          accumulatedScroll.current -= pixelsToScroll; 
        }
        if ((window.innerHeight + Math.ceil(window.pageYOffset)) >= document.body.offsetHeight - 2) {
          setIsAutoScrolling(false);
        }
      }
      if (isAutoScrolling) animationFrameId = requestAnimationFrame(scrollStep);
    };

    if (isAutoScrolling) animationFrameId = requestAnimationFrame(scrollStep);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isAutoScrolling, scrollSpeed]);

  if (loading) return <div className="min-h-screen flex justify-center items-center"><div className="loader"></div></div>;
  if (!prayer) return <div className="text-center p-20 font-bold text-theme-text">دعا یافت نشد.</div>;

  const renderFixedOverlays = () => {
    if (!mounted) return null;
    return createPortal(
      <div className="font-sans" dir="rtl">
        
        {/* --- پاپ‌آپ اختصاصی موبایل --- */}
        {mobilePopup && (
          <div className="fixed inset-0 z-[100000] bg-black bg-opacity-70 flex items-center justify-center p-5 backdrop-blur-sm animate-fade-in md:hidden">
            <div className="bg-theme-surface w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col gap-5 border border-theme-primary border-opacity-20">
              
              <h3 className="font-bold text-theme-text text-xl flex items-center gap-2">
                {mobilePopup === 'search' ? (
                  <><svg className="w-6 h-6 text-theme-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg> جستجو در دعا</>
                ) : (
                  <><svg className="w-6 h-6 text-theme-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg> پرش به فراز</>
                )}
              </h3>

              <div className="relative">
                {mobilePopup === 'search' ? (
                  <input 
                    type="text" value={searchQuery} onChange={onSearchChange} 
                    placeholder="کلمه مورد نظر را بنویسید..." 
                    className="w-full bg-theme-bg border-2 border-theme-primary border-opacity-10 focus:border-theme-accent rounded-2xl p-4 text-theme-text text-sm font-bold outline-none transition-colors"
                    autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                ) : (
                  <input 
                    type="text" inputMode="numeric" value={jumpNumber} onChange={onJumpChange} 
                    placeholder="مثال: 61" dir="ltr"
                    className="w-full bg-theme-bg border-2 border-theme-primary border-opacity-10 focus:border-theme-accent rounded-2xl p-4 text-theme-text text-center font-bold text-2xl outline-none transition-colors tracking-widest"
                    autoFocus onKeyDown={(e) => e.key === 'Enter' && handleJump()}
                  />
                )}
              </div>

              {(jumpError || searchError) && (
                <div className="bg-red-100 text-red-600 text-xs font-bold p-3 rounded-xl text-center animate-fade-in">
                  {jumpError || searchError}
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <button onClick={mobilePopup === 'search' ? handleSearch : handleJump} className="flex-1 bg-theme-primary text-white py-3.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-shadow text-sm">تایید</button>
                <button onClick={() => {setMobilePopup(null); setJumpError(''); setSearchError('');}} className="flex-1 bg-gray-200 text-gray-800 hover:bg-gray-300 py-3.5 rounded-xl font-bold transition-colors text-sm">انصراف</button>
              </div>
            </div>
          </div>
        )}

        {/* --- هدر بالا کاملاً فریز شده --- */}
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-theme-primary text-white shadow-lg w-full py-2.5">
          <div className="max-w-4xl mx-auto px-3 flex items-center justify-between gap-2">
            
            {/* در موبایل اگر جستجو فعال باشد، عنوان مخفی می‌شود تا دکمه‌های قبلی/بعدی جا شوند */}
            <div className={`flex items-center gap-2 overflow-hidden transition-all ${searchResults.length > 0 ? 'hidden md:flex' : 'flex'}`}>
              <Link to="/prayers" className="bg-white bg-opacity-20 p-2 rounded-full hover:bg-opacity-30 transition flex-shrink-0" title="بازگشت به لیست">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </Link>
              <h1 className="font-bold text-theme-accent truncate text-sm md:text-xl">{prayer.title}</h1>
            </div>
            
            <div className={`flex items-center bg-white bg-opacity-10 px-2 py-1.5 md:px-3 md:py-2 rounded-xl transition-all duration-300 flex-shrink-0 ${searchResults.length > 0 ? 'w-full md:w-auto justify-between' : ''}`}>
              
              {/* --- نمای موبایل --- */}
              <div className="flex md:hidden items-center gap-2.5 font-bold w-full">
                {searchResults.length > 0 ? (
                  // اگر نتایج جستجو وجود داشت، این نوار در موبایل نمایش داده می‌شود
                  <div className="flex items-center justify-between w-full gap-2 animate-fade-in">
                    <button onClick={() => {setSearchResults([]); setSearchQuery('');}} className="text-red-400 bg-white bg-opacity-10 p-1.5 rounded-full shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <div className="flex items-center gap-2 text-white bg-black bg-opacity-30 rounded-full px-3 py-1 shrink-0" dir="ltr">
                      <button onClick={nextResult} className="hover:text-theme-accent p-1"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg></button>
                      <span className="text-sm font-bold min-w-[36px] text-center pt-1">{currentSearchIndex + 1}/{searchResults.length}</span>
                      <button onClick={prevResult} className="hover:text-theme-accent p-1"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg></button>
                    </div>
                  </div>
                ) : (
                  // آیکون‌های پیش‌فرض موبایل
                  <>
                    <button onClick={() => {setMobilePopup('search'); setSearchQuery(''); setSearchError('');}} className="text-white hover:text-theme-accent p-1">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </button>
                    <button onClick={() => {setMobilePopup('jump'); setJumpNumber(''); setJumpError('');}} className="text-white hover:text-theme-accent p-1">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
                    </button>

                    <div className="w-px h-4 bg-white bg-opacity-30"></div>

                    <div className="relative flex items-center justify-center w-6 h-6 text-white hover:text-theme-accent transition">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      <select value={arabicFont} onChange={(e) => setArabicFont(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" dir="rtl">
                        <option value="default">عثمان طه (پیش‌فرض)</option>
                        <option value="'Noto Naskh Arabic', serif">نسخ عربی (خوانا)</option>
                        <option value="'Nabi', sans-serif">نبی</option>
                        <option value="'Amiri', serif">امیری</option>
                        <option value="'Scheherazade New', serif">شهرزاد</option>
                        <option value="'Lateef', serif">لطیف</option>
                        <option value="'B Nazanin', 'Nazanin', sans-serif">بی نازنین</option>
                        <option value="'B Yekan', 'Yekan', sans-serif">یکان</option>
                        <option value="Tahoma, sans-serif">تاهوما</option>
                        <option value="system-ui, sans-serif">فونت سیستم</option>
                      </select>
                    </div>
                    
                    <button onClick={() => setShowArabic(!showArabic)} className={`font-arabic text-lg leading-none pt-1 transition-colors ${showArabic ? 'text-theme-accent' : 'text-white opacity-40'}`}>ع</button>
                    <button onClick={() => setShowTranslation(!showTranslation)} className={`text-base leading-none transition-colors ${showTranslation ? 'text-theme-accent' : 'text-white opacity-40'}`}>ف</button>
                    
                    <div className="w-px h-4 bg-white bg-opacity-30"></div>
                    
                    <button onClick={toggleFullScreen} className="text-white hover:text-theme-accent transition pl-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {isFullscreen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 9V4m0 5h5M15 15v5m0-5h-5" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />}
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {/* --- نمای دسکتاپ (حفظ کدهای قبلی) --- */}
              <div className="hidden md:flex items-center gap-4 text-xs font-bold">
                
                {/* جستجوی دسکتاپ */}
                {(!activeTool || activeTool === 'search') && (
                  <div className={`flex items-center transition-all duration-300 ${activeTool === 'search' ? 'w-80 bg-white bg-opacity-20 rounded-full px-3 py-1' : 'w-auto'}`}>
                    {activeTool === 'search' ? (
                      <div className="flex items-center w-full gap-2 py-0.5 animate-fade-in">
                        <button onClick={() => {setActiveTool(null); setSearchResults([]); setSearchQuery('');}} className="text-red-400 hover:text-red-500 p-1 shrink-0">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        {searchResults.length > 0 ? (
                          <>
                            <div className="flex items-center gap-1 text-white bg-black bg-opacity-30 rounded-full px-2 py-1 shrink-0" dir="ltr">
                              <button onClick={nextResult} className="hover:text-theme-accent p-0.5"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg></button>
                              <span className="text-xs font-bold pt-0.5 min-w-[30px] text-center">{currentSearchIndex + 1}/{searchResults.length}</span>
                              <button onClick={prevResult} className="hover:text-theme-accent p-0.5"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg></button>
                            </div>
                            <div className="flex-1 text-white text-sm text-right px-2 truncate opacity-70">{searchQuery}</div>
                          </>
                        ) : (
                          <>
                            <button onClick={handleSearch} className="text-green-400 hover:text-green-500 p-1 shrink-0">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            </button>
                            <input type="text" value={searchQuery} onChange={onSearchChange} placeholder="کلمه مورد نظر..." className="bg-transparent text-white text-sm font-bold outline-none w-full text-right placeholder-white placeholder-opacity-70" onKeyDown={(e) => e.key === 'Enter' && handleSearch()} autoFocus />
                          </>
                        )}
                      </div>
                    ) : (
                      <button onClick={() => {setActiveTool('search'); setJumpNumber('');}} className="flex items-center gap-1.5 text-white hover:text-theme-accent transition p-1">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <span className="whitespace-nowrap">جستجو</span>
                      </button>
                    )}
                  </div>
                )}

                {!activeTool && <div className="w-px h-4 bg-white bg-opacity-30 mx-2"></div>}

                {/* پرش دسکتاپ */}
                {(!activeTool || activeTool === 'jump') && (
                  <div className={`flex items-center transition-all duration-300 ${activeTool === 'jump' ? 'w-64 bg-white bg-opacity-20 rounded-full px-3 py-1' : 'w-auto'}`}>
                    {activeTool === 'jump' ? (
                      <div className="flex items-center w-full gap-2 py-0.5 animate-fade-in">
                        <button onClick={() => {setActiveTool(null); setJumpNumber('');}} className="text-red-400 hover:text-red-500 p-1 shrink-0">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <button onClick={handleJump} className="text-green-400 hover:text-green-500 p-1 shrink-0">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        </button>
                        <input type="text" inputMode="numeric" value={jumpNumber} onChange={onJumpChange} placeholder="شماره فراز..." className="bg-transparent text-white text-sm font-bold outline-none w-full text-center placeholder-white placeholder-opacity-70" dir="ltr" onKeyDown={(e) => e.key === 'Enter' && handleJump()} autoFocus />
                      </div>
                    ) : (
                      <button onClick={() => {setActiveTool('jump'); setSearchQuery(''); setSearchResults([]);}} className="flex items-center gap-1.5 text-white hover:text-theme-accent transition p-1">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
                        <span className="whitespace-nowrap">پرش</span>
                      </button>
                    )}
                  </div>
                )}

                {!activeTool && <div className="w-px h-4 bg-white bg-opacity-30 mx-2"></div>}

                {/* سایر تنظیمات دسکتاپ (هنگام باز شدن ابزار پنهان می‌شوند) */}
                <div className={`flex items-center gap-4 ${activeTool ? 'hidden' : ''}`}>
                  <select value={arabicFont} onChange={(e) => setArabicFont(e.target.value)} className="bg-transparent text-white outline-none border-b border-theme-accent border-opacity-50 pb-1 cursor-pointer">
                    <option value="default" className="text-gray-800">عثمان طه (پیش‌فرض)</option>
                    <option value="'Noto Naskh Arabic', serif" className="text-gray-800">نسخ عربی (خوانا)</option>
                    <option value="'Nabi', sans-serif" className="text-gray-800">نبی</option>
                    <option value="'Amiri', serif" className="text-gray-800">امیری</option>
                    <option value="'Scheherazade New', serif" className="text-gray-800">شهرزاد</option>
                    <option value="'Lateef', serif" className="text-gray-800">لطیف</option>
                    <option value="'B Nazanin', 'Nazanin', sans-serif" className="text-gray-800">بی نازنین</option>
                    <option value="'B Yekan', 'Yekan', sans-serif" className="text-gray-800">یکان</option>
                    <option value="Tahoma, sans-serif" className="text-gray-800">تاهوما</option>
                    <option value="system-ui, sans-serif" className="text-gray-800">فونت سیستم</option>
                  </select>
                  <div className="w-px h-4 bg-white bg-opacity-30"></div>
                  <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={showArabic} onChange={(e) => setShowArabic(e.target.checked)} className="accent-theme-accent w-4 h-4 cursor-pointer"/> متن عربی</label>
                  <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={showTranslation} onChange={(e) => setShowTranslation(e.target.checked)} className="accent-theme-accent w-4 h-4 cursor-pointer"/> ترجمه</label>
                  <div className="w-px h-4 bg-white bg-opacity-30"></div>
                  <button onClick={toggleFullScreen} className="text-white hover:text-theme-accent transition" title="نمایش تمام صفحه">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {isFullscreen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 9V4m0 5h5M15 15v5m0-5h-5" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />}
                    </svg>
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* --- نوار کنترل پایین با افزایش سرعت به 30 (بسیار سریع در موبایل) --- */}
        <div className="fixed bottom-0 left-0 right-0 w-full z-[9999] bg-theme-surface border-t border-theme-primary border-opacity-20 p-2.5 md:p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.15)] flex flex-row flex-nowrap justify-between md:justify-center items-center gap-2 md:gap-4 transition-all">
          <div className="flex flex-1 md:flex-none items-center gap-2 bg-theme-bg px-3 md:px-4 py-2 rounded-full border border-theme-primary border-opacity-10 shadow-inner">
            <label className="hidden md:block text-xs font-bold text-theme-textMuted whitespace-nowrap">تنظیم سرعت:</label>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:hidden text-theme-textMuted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <input type="range" min="0.1" max="30" step="0.1" value={scrollSpeed} onChange={(e) => setScrollSpeed(Number(e.target.value))} className="w-full md:w-40 accent-theme-primary cursor-pointer" dir="ltr" />
          </div>
          <button onClick={() => setIsAutoScrolling(!isAutoScrolling)} className={`px-4 md:px-6 py-2 md:py-2.5 rounded-full font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 md:gap-2 text-sm md:text-base whitespace-nowrap flex-shrink-0 ${isAutoScrolling ? 'bg-red-500 text-white' : 'bg-theme-primary text-white'}`}>
            {isAutoScrolling ? <><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg> توقف</> : <><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> حرکت خودکار</>}
          </button>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="bg-theme-bg min-h-screen flex flex-col pt-24 pb-32 relative animate-fade-in">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Lateef&family=Scheherazade+New:wght@400;700&family=Noto+Naskh+Arabic:wght@400;700&display=swap');
        :root[data-theme='normal'] { --diacritic-color: #e11d48; } 
        :root[data-theme='joyful'] { --diacritic-color: #e11d48; } 
        :root[data-theme='mourning'] { --diacritic-color: #fbbf24; }
        
        nav { display: none !important; }
      `}</style>

      {renderFixedOverlays()}

      <div className="max-w-3xl mx-auto px-4 py-8 flex-1 w-full">
        {prayer.description && (
          <div className="mb-10 pb-8 border-b border-opacity-10 border-theme-primary text-theme-text text-base md:text-lg leading-[2.5rem] md:leading-[3rem] whitespace-pre-line text-justify">
            {prayer.description}
          </div>
        )}

        {!showArabic && !showTranslation && <p className="text-center text-theme-textMuted mt-10 font-bold">لطفاً برای مشاهده دعا، متن عربی یا ترجمه را تیک بزنید.</p>}
        
        {prayer.content.map((stanza, idx) => (
          <div 
            key={idx} 
            ref={(el) => (stanzaRefs.current[idx] = el)} 
            className={`mb-10 text-center border-b border-opacity-10 border-theme-primary pb-8 last:border-0 transition-all duration-500 ${(activeTool === 'search' || mobilePopup === 'search') && searchResults[currentSearchIndex] === idx ? 'bg-theme-accent bg-opacity-10 ring-1 ring-theme-accent rounded-2xl p-4 scale-[1.02] shadow-sm' : ''}`}
          >
            {showArabic && (
              <p style={arabicFont !== 'default' ? { fontFamily: arabicFont } : {}} className={`arabic-text ${arabicFont === 'default' ? 'font-arabic' : ''} text-2xl md:text-3xl text-theme-text font-bold leading-[3.5rem] md:leading-[5rem] ${showTranslation ? 'mb-6' : ''}`} dir="rtl">
                {formatArabicText(stanza.a)}
              </p>
            )}
            {showTranslation && <p className="text-sm md:text-base text-theme-textMuted leading-loose mt-4">{stanza.p}</p>}
          </div>
        ))}

        {/* --- دکمه بازگشت به صفحه اصلی در انتهای دعا --- */}
        <div className="mt-16 mb-8 flex justify-center animate-fade-up">
           <Link to="/" className="bg-theme-primary text-white px-8 py-3.5 rounded-full font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-3">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
               <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
             </svg>
             بازگشت به صفحه اصلی
           </Link>
        </div>

      </div>
    </div>
  );
}