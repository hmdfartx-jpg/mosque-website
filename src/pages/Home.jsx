import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, query, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';

const commonCities = ['هرات', 'کابل', 'مزار شریف', 'قندهار', 'جلال آباد', 'غزنی', 'بامیان', 'بدخشان', 'مشهد', 'تهران', 'قم', 'اصفهان', 'شیراز', 'نجف', 'کربلا', 'کاظمین', 'سامرا', 'مکه', 'مدینه', 'لندن', 'پاریس', 'برلین', 'نیویورک', 'تورنتو', 'سیدنی', 'دبی', 'استانبول'];

// بانک جامع محتوای روزانه
const ayahsList = [
  { ar: "إِنَّ مَعَ العُسرِ يُسرًا", fa: "مسلماً با (هر) سختی آسانی است." },
  { ar: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", fa: "آگاه باشید که با یاد خدا دل‌ها آرام می‌گیرد." },
  { ar: "وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ", fa: "و هنگامی که بندگان من، از تو در باره من سؤال کنند، (بگو:) من نزدیکم!" },
  { ar: "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ", fa: "ای کسانی که ایمان آورده‌اید! از صبر و نماز مدد جویید." }
];

const hadithsList = [
  { ar: "أَفضَلُ العِبادَةِ اِنتِظارُ الفَرَجِ", fa: "برترین عبادت، انتظار فرج است.", source: "پیامبر اکرم (ص)" },
  { ar: "مَن كُنتُ مَولاهُ فَهذا عَلِيٌّ مَولاهُ", fa: "هر که من مولای اویم، این علی مولای اوست.", source: "پیامبر اکرم (ص)" },
  { ar: "حُسْنُ الْخُلُقِ نِصْفُ الدِّينِ", fa: "خوش اخلاقی نیمی از دین است.", source: "امام صادق (ع)" },
  { ar: "عَجِبْتُ لِمَنْ يَقْنَطُ وَ مَعَهُ الِاسْتِغْفَارُ", fa: "در شگفتم از کسی که ناامید می‌شود، در حالی که استغفار را با خود دارد.", source: "امام علی (ع)" }
];

const ahkamList = [
  { text: "اگر آب مضاف با نجس ملاقات کند نجس می‌شود، اگرچه به مقدار کر باشد.", author: "آیت‌الله سیستانی", ref: "توضیح المسائل، مسأله ۴۷" },
  { text: "آب مضاف چیزی را پاک نمی‌کند و وضو و غسل با آن باطل است.", author: "آیت‌الله محقق کابلی", ref: "توضیح المسائل، مسأله ۴۵" },
  { text: "خوردن و آشامیدن در حال نماز، نماز را باطل می‌کند.", author: "آیت‌الله فیاض", ref: "توضیح المسائل، مسأله ۱۱۴۴" },
  { text: "پوشیدن لباس غصبی در نماز باعث بطلان نماز می‌شود.", author: "آیت‌الله فاضلی بهسودی", ref: "توضیح المسائل، مسأله ۸۰۴" },
  { text: "شک در رکعت‌های نماز دو رکعتی و سه رکعتی نماز را باطل می‌کند.", author: "آیت‌الله سیستانی", ref: "توضیح المسائل، مسأله ۱۱۵۵" },
  { text: "خون کمتر از درهم (به اندازه بند انگشت اشاره) در لباس نمازگزار بخشوده است.", author: "آیت‌الله محقق کابلی", ref: "توضیح المسائل، مسأله ۸۴۱" }
];

const shamsiEvents = { "1-1": "عید باستانی نوروز و آغاز سال نو", "1-2": "جشن دهقان", "2-7": "سالروز کودتای کمونیستی ۷ ثور (۱۳۵۷)", "2-8": "سالروز پیروزی جهاد افتخارآفرین مردم افغانستان (۱۳۷۱)", "5-28": "سالروز استرداد استقلال افغانستان (۱۲۹۸)", "10-6": "تجاوز ارتش سرخ شوروی به افغانستان (۱۳۵۸)", "11-26": "خروج ارتش سرخ شوروی از افغانستان (۱۳۶۷)", "12-3": "قیام ۳ حوت مردم کابل (۱۳۵۸)", "12-22": "سالروز شهادت استاد عبدالعلی مزاری (۱۳۷۳)", "12-24": "قیام خونین ۲۴ حوت مردم هرات (۱۳۵۷)" };
const gregorianEvents = { "3-8": "روز جهانی زن", "5-1": "روز جهانی کارگر", "10-5": "روز جهانی معلم" };
const qamariEvents = { "1-9": "تاسوعای حسینی", "1-10": "عاشورای حسینی و شهادت امام حسین (ع)", "1-12": "شهادت امام زین‌العابدین (ع)", "2-20": "اربعین حسینی", "2-28": "رحلت پیامبر اکرم (ص) و شهادت امام حسن (ع)", "2-30": "شهادت امام رضا (ع)", "3-17": "میلاد پیامبر اکرم (ص) و امام صادق (ع)", "6-3": "شهادت حضرت فاطمه زهرا (س)", "6-20": "ولادت حضرت فاطمه زهرا (س) - روز مادر", "7-13": "ولادت امام علی (ع) - روز پدر", "7-27": "مبعث پیامبر اکرم (ص)", "8-11": "ولادت حضرت علی اکبر (ع) - روز جوان", "8-15": "ولادت امام زمان (عج)", "9-19": "ضربت خوردن امام علی (ع)", "9-21": "شهادت امام علی (ع)", "10-1": "عید سعید فطر", "11-1": "ولادت حضرت معصومه (س) - روز دختر", "12-10": "عید سعید قربان", "12-18": "عید غدیر خم" };

export default function Home() {
  const [activeTab, setActiveTab] = useState('ayah');
  const [dailyData, setDailyData] = useState({ ayah: ayahsList[0], hadith: hadithsList[0], hokm: ahkamList[0] });
  
  const [prayers, setPrayers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [openDeptId, setOpenDeptId] = useState(null); 
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [recentArticles, setRecentArticles] = useState([]); 

  const [socials, setSocials] = useState({ telegram: '', facebook: '', whatsapp: '' });
  const [footerSettings, setFooterSettings] = useState({ address: '', phone: '' });

  const [timings, setTimings] = useState(null);
  const [displayLocation, setDisplayLocation] = useState('هرات');
  const [isCitySearchOpen, setIsCitySearchOpen] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [filteredCities, setFilteredCities] = useState([]);
  
  const [dates, setDates] = useState({ shamsi: '...', qamari: '...', gregorian: '...' });
  const [occasion, setOccasion] = useState('در حال دریافت...');
  const [countdown, setCountdown] = useState('در حال محاسبه...');
  const [zikr, setZikr] = useState('...');

  // وضعیت لودینگ برای تک تک بخش‌های سایت
  const [loadingStats, setLoadingStats] = useState({
    prayers: false,
    departments: false,
    slides: false,
    announcements: false,
    activities: false,
    articles: false,
    socials: false,
    footer: false,
    timings: false
  });

  const dariMonths = ['حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله', 'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت'];
  const zikrWeekly = [ "یا ذَالجَلالِ وَ الاِکرام", "یا قاضیَ الحاجات", "یا اَرحَمَ الرّاحِمین", "یا حَیُّ یا قَیّوم", "لا اِلهَ اِلّا اللهُ المَلِکُ الحَقُّ المُبین", "اَللّهُمَّ صَلِّ عَلی مُحَمَّدٍ وَ آلِ مُحَمَّدٍ", "یا رَبَّ العالَمین" ];
  const toPersianNum = (num) => num.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);

  useEffect(() => {
    document.title = "مسجد جامع حضرت خدیجه کبرا (س) | پایگاه اطلاع‌رسانی و فرهنگی";
    
    setDailyData({
      ayah: ayahsList[Math.floor(Math.random() * ayahsList.length)],
      hadith: hadithsList[Math.floor(Math.random() * hadithsList.length)],
      hokm: ahkamList[Math.floor(Math.random() * ahkamList.length)]
    });

    const unsubPrayers = onSnapshot(collection(db, 'prayers'), (snap) => {
      setPrayers(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b)=> (a.order||0)-(b.order||0)).slice(0, 6));
      setLoadingStats(prev => ({ ...prev, prayers: true }));
    });
    
    const unsubDepts = onSnapshot(collection(db, 'departments'), (snap) => {
      setDepartments(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b)=> (a.order||0)-(b.order||0)));
      setLoadingStats(prev => ({ ...prev, departments: true }));
    });
    
    const unsubSlides = onSnapshot(collection(db, 'slider'), (snap) => {
      setSlides(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b)=> (a.order||0)-(b.order||0)));
      setLoadingStats(prev => ({ ...prev, slides: true }));
    });
    
    const unsubAnnc = onSnapshot(query(collection(db, 'announcements'), orderBy('date', 'desc'), limit(3)), (snap) => {
      setRecentAnnouncements(snap.docs.map(d => ({id: d.id, ...d.data()})));
      setLoadingStats(prev => ({ ...prev, announcements: true }));
    });
    
    const unsubActs = onSnapshot(query(collection(db, 'activities'), orderBy('date', 'desc'), limit(3)), (snap) => {
      setRecentActivities(snap.docs.map(d => ({id: d.id, ...d.data()})));
      setLoadingStats(prev => ({ ...prev, activities: true }));
    });
    
    const unsubArts = onSnapshot(query(collection(db, 'articles'), orderBy('date', 'desc'), limit(10)), (snap) => {
      setRecentArticles(snap.docs.map(d => ({id: d.id, ...d.data()})));
      setLoadingStats(prev => ({ ...prev, articles: true }));
    });
    
    const unsubSocials = onSnapshot(doc(db, 'settings', 'socials'), (docSnap) => {
      if(docSnap.exists()) setSocials(docSnap.data());
      setLoadingStats(prev => ({ ...prev, socials: true }));
    });
    
    const unsubFooter = onSnapshot(doc(db, 'settings', 'footer'), (docSnap) => {
      if(docSnap.exists()) setFooterSettings(docSnap.data());
      setLoadingStats(prev => ({ ...prev, footer: true }));
    });

    return () => { unsubPrayers(); unsubDepts(); unsubSlides(); unsubAnnc(); unsubActs(); unsubArts(); unsubSocials(); unsubFooter(); };
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => setCurrentSlide(prev => (prev + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    const now = new Date();
    setZikr(zikrWeekly[now.getDay()]);

    const gMonth = now.getMonth() + 1; const gDay = now.getDate(); const gKey = `${gMonth}-${gDay}`;
    const shamsiFormatter = new Intl.DateTimeFormat('fa-IR-u-nu-latn', { year: 'numeric', month: 'numeric', day: 'numeric' });
    const parts = shamsiFormatter.formatToParts(now);
    const sYear = parts.find(p => p.type === 'year').value;
    const sMonthNum = parseInt(parts.find(p => p.type === 'month').value, 10);
    const sDay = parseInt(parts.find(p => p.type === 'day').value, 10);
    const sKey = `${sMonthNum}-${sDay}`;

    const gregorianFormatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const gregorianStr = gregorianFormatter.format(now);

    setDates(prev => ({ 
      ...prev, 
      gregorian: gregorianStr, 
      shamsi: `${toPersianNum(sDay)} ${dariMonths[sMonthNum - 1]} ${toPersianNum(sYear)}` 
    }));

    let todayEvents = [];
    if (shamsiEvents[sKey]) todayEvents.push(shamsiEvents[sKey]);
    if (gregorianEvents[gKey]) todayEvents.push(gregorianEvents[gKey]);

    fetchTimingsByAddress('Herat, Afghanistan', 'هرات', todayEvents);
  }, []);

  const fetchTimingsByAddress = async (address, displayName, initialEvents = null) => {
    setTimings(null); 
    try {
      const response = await fetch(`https://api.aladhan.com/v1/timingsByAddress?address=${encodeURIComponent(address)}&method=0`);
      const data = await response.json();
      
      if (data.code === 200) {
        const t = data.data.timings;
        setTimings({ "اذان صبح": t.Fajr, "طلوع آفتاب": t.Sunrise, "اذان ظهر": t.Dhuhr, "غروب آفتاب": t.Sunset, "اذان مغرب": t.Maghrib, "نیمه‌شب شرعی": t.Midnight });
        setDisplayLocation(displayName || address);

        const hijri = data.data.date.hijri;
        let adjustedDay = parseInt(hijri.day, 10) - 1;
        if (adjustedDay <= 0) adjustedDay = 29; 
        const qKey = `${parseInt(hijri.month.number, 10)}-${adjustedDay}`;
        
        setDates(prev => ({ ...prev, qamari: `${toPersianNum(adjustedDay)} ${hijri.month.ar} ${toPersianNum(hijri.year)}` }));

        let allEvents = initialEvents ? [...initialEvents] : [];
        if (qamariEvents[qKey]) allEvents.push(qamariEvents[qKey]);
        setOccasion(allEvents.length > 0 ? allEvents.join('\n • ') : "بدون مناسبت خاص");
        setIsCitySearchOpen(false); 
      } else {
        alert('متأسفانه شهر مورد نظر یافت نشد.');
      }
    } catch (error) { 
      console.log(error); 
    } finally {
      // در هر صورت (چه موفق چه خطا) لودینگ اوقات شرعی را تمام شده در نظر می‌گیریم تا سایت متوقف نشود
      setLoadingStats(prev => ({ ...prev, timings: true }));
    }
  };

  const handleCitySearch = (val) => {
    setCitySearchQuery(val);
    if (val.trim().length > 0) {
      setFilteredCities(commonCities.filter(c => c.includes(val)));
    } else {
      setFilteredCities([]);
    }
  };

  useEffect(() => {
    if (!timings) return;
    const calculateCountdown = () => {
      const now = new Date();
      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
      let nextPrayerName = "", nextPrayerMinutes = 24 * 60; 
      for (const [name, timeStr] of Object.entries(timings)) {
        const [h, m] = timeStr.split(':').map(Number);
        const prayerTotalMinutes = h * 60 + m;
        if (prayerTotalMinutes > currentTotalMinutes && prayerTotalMinutes < nextPrayerMinutes) {
          nextPrayerMinutes = prayerTotalMinutes; nextPrayerName = name;
        }
      }
      if (nextPrayerName === "") {
        nextPrayerName = "اذان صبح (فردا)";
        const [h, m] = timings["اذان صبح"].split(':').map(Number);
        nextPrayerMinutes = (24 * 60) + (h * 60 + m);
      }
      const diff = nextPrayerMinutes - currentTotalMinutes;
      const hours = Math.floor(diff / 60); const minutes = diff % 60;
      let timeText = hours > 0 ? `${toPersianNum(hours)} ساعت و ` : "";
      setCountdown(`${timeText}${toPersianNum(minutes)} دقیقه تا ${nextPrayerName}`);
    };
    calculateCountdown();
    const interval = setInterval(calculateCountdown, 60000);
    return () => clearInterval(interval);
  }, [timings]);

  // بررسی اینکه آیا تمام بخش‌های دیتابیس با موفقیت لود شده‌اند یا خیر
  const isAppReady = Object.values(loadingStats).every(Boolean);

  // اگر هنوز اطلاعات در حال دریافت است، صفحه اختصاصی لودینگ را نشان بده
  if (!isAppReady) {
    return (
      <div className="fixed inset-0 z-[9999] bg-theme-bg flex flex-col justify-center items-center">
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 border-4 border-theme-primary border-opacity-20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-theme-accent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-theme-primary">
            {/* آیکون مسجد در حال تپش */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L8 6v3H4v13h16V9h-4V6l-4-4zm0 2.8l2 2V9h-4V6.8l2-2zM6 11h3v9H6v-9zm12 0v9h-3v-9h3zM10 11h4v4h-4v-4zm0 6h4v3h-4v-3z"/>
            </svg>
          </div>
        </div>
        <h2 className="text-xl md:text-3xl font-bold text-theme-text mb-3 tracking-wide">مسجد جامع حضرت خدیجه کبری <span className="text-theme-accent">(س)</span></h2>
        <p className="text-theme-textMuted text-sm md:text-base font-bold animate-pulse">در حال دریافت اطلاعات از سرور...</p>
      </div>
    );
  }

  // اگر تمام اطلاعات دریافت شده بود، صفحه اصلی را رندر کن
  return (
    <div className="view-section pb-0 overflow-hidden animate-fade-in">
      <style>{`
        /* انیمیشن حلقه بی‌نهایت از چپ به راست */
        @keyframes marquee-right-seamless {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0%); }
        }
        .animate-marquee-right {
          display: flex;
          width: max-content;
          animation: marquee-right-seamless 140s linear infinite;
        }
      `}</style>

      {/* اسلایدر هیرو با لایه تاریک ملایم */}
      <header className="relative bg-gray-900 h-80 md:h-[32rem] overflow-hidden shadow-lg animate-fade-in">
        {slides.length > 0 ? slides.map((slide, index) => (
          <div key={slide.id} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
            <img src={slide.imageUrl || 'https://via.placeholder.com/800x400?text=Mosque'} alt={slide.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black bg-opacity-50 transition-all duration-300"></div>
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 pt-24 z-10 text-white drop-shadow-xl">
              <h1 className="text-3xl md:text-5xl font-bold mb-4 text-theme-accent">{slide.title}</h1>
              <p className="text-sm md:text-xl max-w-2xl leading-relaxed">{slide.subtitle}</p>
            </div>
          </div>
        )) : (
          <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 pt-24 text-white bg-theme-primary mihrab-shape">
             <h1 className="text-3xl md:text-5xl font-bold mb-4 text-theme-accent drop-shadow-lg">مسجد جامع حضرت خدیجه کبری (س)</h1>
             <p className="text-sm md:text-lg drop-shadow">پایگاه اطلاع‌رسانی و فعالیت‌های فرهنگی مذهبی</p>
          </div>
        )}
        <div className="absolute bottom-6 w-full flex justify-center gap-2 z-20">
          {slides.map((_, i) => <div key={i} className={`h-2 rounded-full transition-all duration-500 shadow-sm ${i === currentSlide ? 'w-6 bg-theme-accent' : 'w-2 bg-white bg-opacity-50'}`}></div>)}
        </div>
      </header>

      {/* نوار تاریخ و ذکر */}
      <div className="bg-theme-secondary text-white py-3 px-4 shadow text-center relative z-20">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-bold">
          <p className="font-arabic bg-black bg-opacity-30 px-5 py-2 rounded-full text-white transition-colors duration-300 shadow-sm">
            ذکر روز: {zikr} <span className="font-sans text-xs mr-1 opacity-90">(۱۰۰ مرتبه)</span>
          </p>
          <div className="flex flex-wrap justify-center gap-3 md:gap-6 text-sm items-center">
            <span>{dates.shamsi}</span>
            <span className="hidden md:inline opacity-40">|</span>
            <span>{dates.qamari}</span>
            <span className="hidden md:inline opacity-40">|</span>
            <span dir="ltr">{dates.gregorian}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-10 relative z-20">
        
        {/* بخش اوقات شرعی با هدر هم‌طراز */}
        <section className="bg-theme-surface rounded-2xl shadow-md p-5 mb-8 border border-opacity-20 border-theme-primary relative overflow-visible animate-fade-up">
          {isCitySearchOpen && (
            <div className="absolute inset-0 bg-theme-surface z-30 flex flex-col items-center justify-center p-4 backdrop-blur-md bg-opacity-95 animate-fade-in rounded-2xl shadow-xl">
              <h3 className="font-bold mb-4 text-theme-text text-lg">جستجوی اوقات شرعی شهرهای جهان</h3>
              <div className="relative w-full max-w-md flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input type="text" placeholder="نام شهر (مثلاً: کابل، London)" value={citySearchQuery} onChange={(e) => handleCitySearch(e.target.value)} className="w-full p-3 rounded-xl border border-theme-primary text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-theme-primary transition-all duration-300" />
                  {filteredCities.length > 0 && (
                    <ul className="absolute top-full right-0 w-full bg-white border border-gray-200 rounded-xl mt-2 max-h-48 overflow-y-auto z-40 shadow-xl text-gray-800 text-sm animate-fade-in">
                      {filteredCities.map((city, index) => (
                        <li key={index} onClick={() => { setCitySearchQuery(city); setFilteredCities([]); fetchTimingsByAddress(city, city); }} className="px-4 py-3 hover:bg-theme-primary hover:bg-opacity-10 cursor-pointer border-b last:border-0 border-gray-100 transition-colors duration-200 font-bold">
                          {city}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex gap-2 mt-2 sm:mt-0">
                  <button onClick={() => { fetchTimingsByAddress(citySearchQuery, citySearchQuery); setFilteredCities([]); }} className="flex-1 sm:flex-none bg-theme-primary text-white px-6 py-3 rounded-xl text-sm font-bold shadow hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">جستجو</button>
                  <button onClick={() => { setIsCitySearchOpen(false); setFilteredCities([]); }} className="flex-1 sm:flex-none bg-gray-200 text-gray-800 px-6 py-3 rounded-xl text-sm font-bold hover:bg-gray-300 transition-colors duration-300">انصراف</button>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 border-b border-theme-primary border-opacity-10 pb-5">
            <h2 className="font-bold text-theme-text flex items-center gap-2 text-lg md:text-xl whitespace-nowrap">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-theme-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              اوقات شرعی ({displayLocation})
            </h2>
            <div className="text-sm font-bold text-theme-text border border-theme-primary border-opacity-20 bg-theme-bg px-6 py-2 rounded-xl shadow-sm text-center flex-1 max-w-xs transition-all duration-300 hover:shadow-md">
              {countdown}
            </div>
            <button onClick={() => setIsCitySearchOpen(true)} className="flex items-center gap-1.5 text-xs md:text-sm bg-theme-primary text-white hover:bg-opacity-90 px-5 py-2.5 rounded-full shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 font-bold whitespace-nowrap">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              تغییر شهر
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center">
            {timings ? Object.entries(timings).map(([name, time]) => (
              <div key={name} className="flex flex-col items-center p-3.5 rounded-xl bg-theme-bg border border-theme-primary border-opacity-10 hover:border-opacity-30 hover:-translate-y-1 hover:shadow-md transition-all duration-300 cursor-default">
                <span className="text-theme-textMuted mb-2 text-xs font-bold">{name}</span>
                <span className="font-bold text-theme-text text-lg md:text-xl">{toPersianNum(time)}</span>
              </div>
            )) : <div className="col-span-6 flex justify-center py-6"><span className="loader"></span></div>}
          </div>

          <div className="mt-5 text-center">
            <p className="text-xs md:text-sm text-theme-text font-bold bg-theme-bg border border-theme-primary border-opacity-20 inline-block px-5 py-2 rounded-xl shadow-sm transition-all duration-300">
              <span className="text-theme-accent ml-1 text-lg leading-none align-middle">★</span>
              جهت رعایت احتیاط شرعی، لطفاً ۱ تا ۲ دقیقه قبل و بعد از این اوقات مراعات فرمایید.
            </p>
          </div>
        </section>

        {/* مناسبت روز */}
        <section className="bg-theme-surface rounded-2xl shadow-md p-5 mb-8 border-r-4 border-theme-accent flex items-start gap-4 transition-all duration-300 hover:shadow-lg animate-fade-up">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-theme-accent flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <div className="w-full">
            <span className="text-xs text-theme-textMuted block mb-2 font-bold">مناسبت‌های امروز:</span>
            <span className="font-bold text-theme-text text-sm md:text-base leading-loose whitespace-pre-line block">
              {occasion === "بدون مناسبت خاص" ? occasion : `• ${occasion}`}
            </span>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            
            {/* محتوای روزانه (بانک اطلاعاتی داینامیک) */}
            <section className="bg-theme-surface rounded-3xl shadow-md overflow-hidden border border-opacity-20 border-theme-primary animate-fade-up delay-200">
              <div className="flex bg-theme-bg">
                {['ayah', 'hadith', 'ahkam'].map(t => (
                  <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-4 text-sm font-bold transition-all duration-300 ${activeTab === t ? 'bg-theme-primary text-white shadow-inner' : 'text-theme-textMuted hover:bg-gray-50 border-b border-theme-primary border-opacity-10'}`}>
                    {t === 'ayah' ? 'آیه روز' : t === 'hadith' ? 'حدیث روز' : 'احکام فقهی'}
                  </button>
                ))}
              </div>
              <div className="p-8 text-center min-h-[220px] flex flex-col justify-center items-center border-t-0">
                <div className="animate-fade-in w-full">
                  {activeTab === 'ahkam' ? (
                    <>
                      <p className="text-theme-text text-base md:text-lg leading-loose mb-6 font-bold">{dailyData.hokm.text}</p>
                      <div className="flex justify-center items-center gap-2 text-xs md:text-sm text-theme-accent bg-theme-primary bg-opacity-5 inline-flex px-4 py-2 rounded-xl font-bold">
                        <span>{dailyData.hokm.author}</span>
                        <span>-</span>
                        <span>{dailyData.hokm.ref}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="font-arabic text-2xl md:text-3xl mb-5 text-theme-text font-bold leading-loose">{activeTab === 'ayah' ? dailyData.ayah.ar : dailyData.hadith.ar}</p>
                      <p className="text-sm md:text-base text-theme-textMuted mb-4">{activeTab === 'ayah' ? dailyData.ayah.fa : dailyData.hadith.fa}</p>
                      {activeTab === 'hadith' && <span className="bg-theme-primary text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">{dailyData.hadith.source}</span>}
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* اطلاعیه‌ها و برنامه‌ها در یک ردیف */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="bg-theme-surface rounded-3xl shadow-sm p-6 border border-opacity-10 border-theme-primary flex flex-col h-full hover:shadow-md transition-shadow duration-300 animate-fade-up delay-300">
                <div className="flex justify-between items-center border-b border-theme-primary border-opacity-10 pb-4 mb-5">
                  <h2 className="font-bold text-lg text-theme-text">اطلاعیه‌ها</h2>
                  <Link to="/announcements" className="text-xs text-white font-bold hover:bg-opacity-80 bg-theme-primary px-4 py-1.5 rounded-full shadow-sm transition-all">همه</Link>
                </div>
                <div className="space-y-4 flex-1">
                  {recentAnnouncements.map(item => (
                    <Link to={`/announcements/${item.id}`} key={item.id} className="flex bg-theme-bg rounded-xl border-r-4 border-theme-accent hover:-translate-y-1 hover:shadow-sm transition-all duration-300 overflow-hidden group">
                      {item.imageUrl && <img src={item.imageUrl} alt="" className="w-20 sm:w-24 object-cover flex-shrink-0" />}
                      <div className="p-3 flex-1 flex flex-col justify-center">
                        <h3 className="font-bold text-sm text-theme-text mb-1 line-clamp-1">{item.title}</h3>
                        <p className="text-[11px] text-theme-textMuted line-clamp-2 leading-relaxed">{item.summary}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="bg-theme-surface rounded-3xl shadow-sm p-6 border border-opacity-10 border-theme-primary flex flex-col h-full hover:shadow-md transition-shadow duration-300 animate-fade-up delay-300">
                <div className="flex justify-between items-center border-b border-theme-primary border-opacity-10 pb-4 mb-5">
                  <h2 className="font-bold text-lg text-theme-text">برنامه‌ها</h2>
                  <Link to="/activities" className="text-xs text-white font-bold hover:bg-opacity-80 bg-theme-primary px-4 py-1.5 rounded-full shadow-sm transition-all">همه</Link>
                </div>
                <div className="space-y-4 flex-1">
                  {recentActivities.map(item => (
                    <Link to={`/activities/${item.id}`} key={item.id} className="flex bg-theme-bg rounded-xl border border-theme-primary border-opacity-10 hover:-translate-y-1 hover:shadow-sm transition-all duration-300 overflow-hidden group">
                      {(item.imageUrl || (item.images && item.images.length > 0)) && <img src={item.images && item.images.length > 0 ? item.images[0] : item.imageUrl} alt="" className="w-20 sm:w-24 object-cover flex-shrink-0" />}
                      <div className="p-3 flex-1 flex flex-col justify-center">
                        <h3 className="font-bold text-sm text-theme-text mb-1 line-clamp-1">{item.title}</h3>
                        <p className="text-[11px] text-theme-textMuted">{item.date}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </div>

            {/* بخش مقالات در پایین */}
            <section className="bg-theme-surface rounded-3xl shadow-sm p-6 border border-opacity-10 border-theme-primary w-full hover:shadow-md transition-shadow duration-300 animate-fade-up delay-400">
              <div className="flex justify-between items-center border-b border-theme-primary border-opacity-10 pb-4 mb-5">
                <h2 className="font-bold text-lg text-theme-text">آخرین مقالات معارفی</h2>
                <Link to="/articles" className="text-xs text-white font-bold hover:bg-opacity-80 bg-theme-primary px-4 py-1.5 rounded-full shadow-sm transition-all">مشاهده همه</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {recentArticles.length > 0 ? recentArticles.map(article => (
                  <Link to={`/articles/${article.id}`} key={article.id} className="bg-theme-bg rounded-2xl p-5 hover:-translate-y-1 hover:shadow-md transition-all duration-300 group border border-theme-primary border-opacity-10 flex flex-col justify-center">
                    <h3 className="font-bold text-sm md:text-base text-theme-text mb-2 group-hover:text-theme-accent transition-colors line-clamp-2">{article.title}</h3>
                    <p className="text-xs text-theme-textMuted line-clamp-3 leading-relaxed mt-auto">{article.summary}</p>
                  </Link>
                )) : <p className="text-sm text-theme-textMuted text-center py-4 col-span-full">مقاله‌ای یافت نشد.</p>}
              </div>
            </section>

          </div>

          <div className="space-y-8 animate-fade-up delay-400">
            
            <section className="bg-theme-surface rounded-3xl shadow-sm p-6 border border-opacity-10 border-theme-primary hover:shadow-md transition-shadow duration-300">
               <div className="flex justify-between items-center border-b border-theme-primary border-opacity-10 pb-4 mb-5">
                <h2 className="font-bold text-lg text-theme-text">ادعیه منتخب</h2>
                <Link to="/prayers" className="text-xs text-white font-bold hover:bg-opacity-80 bg-theme-primary px-4 py-1.5 rounded-full shadow-sm transition-all">کتابخانه</Link>
              </div>
              <div className="flex flex-col gap-3">
                {prayers.map(prayer => (
                  <Link key={prayer.id} to={`/prayers/${prayer.id}`} className="bg-theme-bg p-4 rounded-xl text-sm md:text-base font-bold text-theme-text hover:bg-theme-primary hover:bg-opacity-10 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300 border border-transparent hover:border-theme-primary hover:border-opacity-20 flex justify-between items-center group">
                    {prayer.title}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-theme-textMuted group-hover:text-theme-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                  </Link>
                ))}
              </div>
            </section>

            <div className="flex flex-col gap-4">
              {socials.telegram && (
                <a href={`https://t.me/${socials.telegram}`} target="_blank" rel="noreferrer" className="w-full bg-blue-500 text-white py-4 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all text-center font-bold flex items-center justify-center gap-3">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.13 7.19c-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5l.22-1.59c.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.08-.19-.09-.05-.21-.02-.3.01l-6.1 4.04c-.58.4-1.1.59-1.56.58-.5-.01-1.46-.28-2.18-.52-.88-.29-1.58-.45-1.52-.96.03-.25.38-.51 1.05-.78 4.11-1.79 6.86-2.98 8.24-3.56 3.92-1.64 4.74-1.92 5.27-1.93.12 0 .38.03.52.14z"/></svg>
                  گروه تلگرام مسجد
                </a>
              )}
              {socials.facebook && (
                <a href={socials.facebook.includes('http') ? socials.facebook : `https://facebook.com/${socials.facebook}`} target="_blank" rel="noreferrer" className="w-full bg-blue-800 text-white py-4 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all text-center font-bold flex items-center justify-center gap-3">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H7v-3h3V9.5c0-2.97 1.77-4.6 4.46-4.6 1.3 0 2.67.23 2.67.23v2.94h-1.5c-1.48 0-1.94.92-1.94 1.86V12h3.33l-.53 3h-2.8v6.8c4.56-.93 8-4.96 8-9.8z"/></svg>
                  صفحه رسمی فیسبوک
                </a>
              )}
            </div>

            {departments.length > 0 && (
              <section className="bg-theme-surface rounded-3xl shadow-sm p-6 border border-opacity-10 border-theme-primary hover:shadow-md transition-shadow duration-300">
                <div className="flex justify-between items-center border-b border-theme-primary border-opacity-10 pb-4 mb-5">
                  <h2 className="font-bold text-lg text-theme-text">تماس با مسجد</h2>
                  <Link to="/about" className="text-xs text-white font-bold hover:bg-opacity-80 bg-theme-primary px-4 py-1.5 rounded-full shadow-sm transition-all">جزئیات</Link>
                </div>
                <div className="space-y-4">
                  {departments.map(dept => (
                    <div key={dept.id} className="border border-theme-primary border-opacity-10 rounded-2xl overflow-hidden bg-theme-bg transition-all duration-300">
                      <button onClick={() => setOpenDeptId(openDeptId === dept.id ? null : dept.id)} className="w-full flex justify-between items-center p-4 md:p-5 bg-theme-surface hover:bg-theme-primary hover:bg-opacity-5 transition-colors">
                        <span className="font-bold text-theme-text text-sm md:text-base">{dept.name}</span>
                        <svg className={`h-5 w-5 text-theme-accent transition-transform duration-300 ${openDeptId === dept.id ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      
                      {openDeptId === dept.id && (
                        <div className="p-4 bg-transparent border-t border-theme-primary border-opacity-10 animate-fade-in">
                          <div className="flex flex-wrap justify-center gap-2.5">
                            {dept.phones.map((phone, i) => (
                              <a key={i} href={`tel:${phone}`} title="تماس مستقیم" className="flex items-center gap-2 bg-theme-primary text-white p-3 rounded-xl hover:-translate-y-0.5 hover:shadow-md transition-all duration-300" dir="ltr">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                              </a>
                            ))}
                            {dept.whatsapp && (
                              <a href={`https://wa.me/${dept.whatsapp}`} title="واتساپ" className="flex items-center gap-2 bg-green-600 text-white p-3 rounded-xl hover:-translate-y-0.5 hover:shadow-md hover:bg-green-700 transition-all duration-300 font-bold">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.393 0 0 5.392 0 12.031c0 2.115.55 4.183 1.597 6L.065 24l6.103-1.603a12.002 12.002 0 0 0 5.863 1.523h.005c6.637 0 12.03-5.394 12.03-12.031S18.669 0 12.031 0zm... "/><path d="M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .015 5.448.015 12.032c0 2.112.553 4.175 1.605 5.99L0 24l6.147-1.614c1.761.956 3.751 1.46 5.898 1.46h.004c6.58 0 12.028-5.446 12.028-12.028 0-3.189-1.24-6.177-3.557-8.369zm-8.475 18.397h-.003c-1.786 0-3.527-.48-5.056-1.385l-.362-.214-3.754.986.998-3.66-.235-.373a10.057 10.057 0 0 1-1.536-5.418c0-5.552 4.516-10.069 10.075-10.069 2.692 0 5.217 1.047 7.118 2.949 1.901 1.902 2.949 4.428 2.949 7.12 0 5.551-4.516 10.064-10.074 10.064zm5.526-7.551c-.304-.152-1.796-.885-2.073-.986-.277-.101-.48-.152-.682.152-.202.304-.784.986-.96 1.188-.178.203-.356.228-.66.076-.303-.152-1.282-.472-2.441-1.521-.903-.817-1.512-1.826-1.69-2.13-.177-.303-.019-.467.133-.619.136-.137.304-.355.456-.532.152-.178.203-.304.304-.507.101-.203.05-.381-.026-.532-.076-.153-.682-1.645-.934-2.253-.246-.593-.496-.513-.682-.521-.177-.008-.381-.01-.583-.01-.203 0-.532.076-.811.381-.278.304-1.064 1.04-1.064 2.541 0 1.501 1.089 2.952 1.242 3.155.152.203 2.15 3.284 5.207 4.606 2.052.89 2.723.957 3.65.803.926-.154 2.996-1.22 3.42-2.404.423-1.183.423-2.195.297-2.404-.127-.208-.48-.31-.784-.462z"/></svg>
                              </a>
                            )}
                            {dept.telegram && (
                              <a href={`tg://resolve?domain=${dept.telegram}`} title="تلگرام" className="flex items-center gap-2 bg-blue-600 text-white p-3 rounded-xl hover:-translate-y-0.5 hover:shadow-md hover:bg-blue-700 transition-all duration-300 font-bold">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.13 7.19c-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5l.22-1.59c.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.08-.19-.09-.05-.21-.02-.3.01l-6.1 4.04c-.58.4-1.1.59-1.56.58-.5-.01-1.46-.28-2.18-.52-.88-.29-1.58-.45-1.52-.96.03-.25.38-.51 1.05-.78 4.11-1.79 6.86-2.98 8.24-3.56 3.92-1.64 4.74-1.92 5.27-1.93.12 0 .38.03.52.14z"/></svg>
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* فوتر */}
      <footer className="bg-theme-primary text-white relative overflow-hidden mt-8 pt-12">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 pb-12">
          <div>
            <h3 className="font-bold text-2xl mb-5 text-theme-accent">درباره مسجد</h3>
            <p className="text-sm leading-loose opacity-90 text-justify">
              مسجد جامع حضرت خدیجه کبرا (س) پایگاهی برای ترویج معارف ناب اسلامی و مکتب اهل‌بیت (ع) می‌باشد که همواره در خدمت مؤمنین خداجو است.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-2xl mb-5 text-theme-accent">آدرس</h3>
            <p className="text-sm opacity-90 leading-relaxed">{footerSettings.address || "آدرس در تنظیمات پنل ثبت نشده است"}</p>
          </div>
          <div className="flex flex-col md:items-start items-center">
            <h3 className="font-bold text-2xl mb-6 text-theme-accent">ارتباط سریع</h3>
            <div className="flex gap-5">
              {footerSettings.phone && (
                <a href={`tel:${footerSettings.phone}`} title="تماس تلفنی" className="bg-white bg-opacity-10 p-3 rounded-full hover:bg-theme-accent hover:text-theme-primary transition-all duration-300 shadow-md">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                </a>
              )}
              {socials.whatsapp && (
                <a href={`https://wa.me/${socials.whatsapp}`} target="_blank" rel="noreferrer" title="واتساپ" className="bg-white bg-opacity-10 p-3 rounded-full hover:bg-green-500 transition-all duration-300 shadow-md">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.393 0 0 5.392 0 12.031c0 2.115.55 4.183 1.597 6L.065 24l6.103-1.603a12.002 12.002 0 0 0 5.863 1.523h.005c6.637 0 12.03-5.394 12.03-12.031S18.669 0 12.031 0zm... "/><path d="M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .015 5.448.015 12.032c0 2.112.553 4.175 1.605 5.99L0 24l6.147-1.614c1.761.956 3.751 1.46 5.898 1.46h.004c6.58 0 12.028-5.446 12.028-12.028 0-3.189-1.24-6.177-3.557-8.369zm-8.475 18.397h-.003c-1.786 0-3.527-.48-5.056-1.385l-.362-.214-3.754.986.998-3.66-.235-.373a10.057 10.057 0 0 1-1.536-5.418c0-5.552 4.516-10.069 10.075-10.069 2.692 0 5.217 1.047 7.118 2.949 1.901 1.902 2.949 4.428 2.949 7.12 0 5.551-4.516 10.064-10.074 10.064zm5.526-7.551c-.304-.152-1.796-.885-2.073-.986-.277-.101-.48-.152-.682.152-.202.304-.784.986-.96 1.188-.178.203-.356.228-.66.076-.303-.152-1.282-.472-2.441-1.521-.903-.817-1.512-1.826-1.69-2.13-.177-.303-.019-.467.133-.619.136-.137.304-.355.456-.532.152-.178.203-.304.304-.507.101-.203.05-.381-.026-.532-.076-.153-.682-1.645-.934-2.253-.246-.593-.496-.513-.682-.521-.177-.008-.381-.01-.583-.01-.203 0-.532.076-.811.381-.278.304-1.064 1.04-1.064 2.541 0 1.501 1.089 2.952 1.242 3.155.152.203 2.15 3.284 5.207 4.606 2.052.89 2.723.957 3.65.803.926-.154 2.996-1.22 3.42-2.404.423-1.183.423-2.195.297-2.404-.127-.208-.48-.31-.784-.462z"/></svg>
                </a>
              )}
              {socials.telegram && (
                <a href={`https://t.me/${socials.telegram}`} target="_blank" rel="noreferrer" title="تلگرام" className="bg-white bg-opacity-10 p-3 rounded-full hover:bg-blue-500 transition-all duration-300 shadow-md">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.13 7.19c-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5l.22-1.59c.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.08-.19-.09-.05-.21-.02-.3.01l-6.1 4.04c-.58.4-1.1.59-1.56.58-.5-.01-1.46-.28-2.18-.52-.88-.29-1.58-.45-1.52-.96.03-.25.38-.51 1.05-.78 4.11-1.79 6.86-2.98 8.24-3.56 3.92-1.64 4.74-1.92 5.27-1.93.12 0 .38.03.52.14z"/></svg>
                </a>
              )}
              {socials.facebook && (
                <a href={socials.facebook.includes('http') ? socials.facebook : `https://facebook.com/${socials.facebook}`} target="_blank" rel="noreferrer" title="فیسبوک" className="bg-white bg-opacity-10 p-3 rounded-full hover:bg-blue-800 transition-all duration-300 shadow-md">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H7v-3h3V9.5c0-2.97 1.77-4.6 4.46-4.6 1.3 0 2.67.23 2.67.23v2.94h-1.5c-1.48 0-1.94.92-1.94 1.86V12h3.33l-.53 3h-2.8v6.8c4.56-.93 8-4.96 8-9.8z"/></svg>
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="bg-black bg-opacity-30 py-4 text-center text-xs font-bold text-white text-opacity-80">
          تمام حقوق برای بخش فرهنگی مسجد جامع حضرت خدیجه کبرا (س) محفوظ است.
        </div>
      </footer>

    </div>
  );
}