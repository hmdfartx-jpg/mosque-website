import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, query, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';

const commonCities = ['هرات', 'کابل', 'مزار شریف', 'قندهار', 'جلال آباد', 'غزنی', 'بامیان', 'بدخشان', 'مشهد', 'تهران', 'قم', 'اصفهان', 'شیراز', 'نجف', 'کربلا', 'کاظمین', 'سامرا', 'مکه', 'مدینه', 'لندن', 'پاریس', 'برلین', 'نیویورک', 'تورنتو', 'سیدنی', 'دبی', 'استانبول'];

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
  const [logoUrl, setLogoUrl] = useState(''); 

  const [timings, setTimings] = useState(null);
  const [displayLocation, setDisplayLocation] = useState('هرات');
  const [isCitySearchOpen, setIsCitySearchOpen] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [filteredCities, setFilteredCities] = useState([]);
  
  const [dates, setDates] = useState({ shamsi: '...', qamari: '...', gregorian: '...' });
  const [occasion, setOccasion] = useState('در حال دریافت...');
  const [countdown, setCountdown] = useState('در حال محاسبه...');
  const [zikr, setZikr] = useState('...');

  const [loadingStats, setLoadingStats] = useState({
    prayers: false, departments: false, slides: false,
    announcements: false, activities: false, articles: false,
    socials: false, footer: false, timings: false, logo: false
  });

  const dariMonths = ['حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله', 'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت'];
  const zikrWeekly = [ "یا ذَالجَلالِ وَ الاِکرام", "یا قاضیَ الحاجات", "یا اَرحَمَ الرّاحِمین", "یا حَیُّ یا قَیّوم", "لا اِلهَ اِلّا اللهُ المَلِکُ الحَقُّ المُبین", "اَللّهُمَّ صَلِّ عَلی مُحَمَّدٍ وَ آلِ مُحَمَّدٍ", "یا رَبَّ العالَمین" ];
  const toPersianNum = (num) => num.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);

  // لوگوی اختصاصی کاربر (SVG)
  const MosqueLogo = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full" fill="currentColor" viewBox="0 0 456.11 452.95">
      <path d="M448.38,159.45c-2.29,5.27-6.85,6.13-10.9,9.43-35.12,28.67-43.51,64.7-66.65,100.36-13.74,21.17-30.11,25.9-52.87,13.48-4.01-2.18-7.33-7.11-12.41-6.81.33,9.87-21.41,33.93-29.56,34.64-4.52.4-9.69-11.3-11.3-15.21-4.63-11.19-5.22-16.06-2.31-27.98,1.53-6.25,11.13-26.41,10.01-30.21-.24-.8-2.16-2.99-2.56-2.99h-67.57c3.32,10.12,12.13,17.32,15.43,27.97,5.52,17.82,2.63,32.87-9.38,46.76-16.44,19.02-38.18,23.94-61.02,12.65-6.18-3.06-23.22-17.24-26.04-17.95-1.5-.38-3.6.43-3.6,1.44v16.48c0,1.42-3.24,5.24-3.04,7.51.25,2.99,4.86,11.17,6.08,14.73,8.99,26.18,19.93,64.99-9.99,81.79-5.81,3.26-36.72,15.98-42.06,16.26-3.93.2-4.47-2.45-1.86-4.43,3.77-2.86,11.86-5.75,16.73-9.34,13.41-9.88,26.1-27.74,29.41-44.21,2.12-10.55,4.67-36.79-5.21-43.58-3.02-2.08-7.49-1.97-9.9-4.39-1.85-1.86-8.6-17.36-8.7-19.93-.28-7.17,13.44-10.22,14.2-20.9.52-7.32-7.18-12.41-8.5-18.8-.64-3.11-1.74-13.52,4.14-10.74,2.28,1.08,14.03,13.58,17.57,16.5,26.65,21.98,61.34,28.11,79.32-7.51,3.31-6.55,9.45-19.29.59-22.9-21.65-8.82-55.25-2.82-78.26-2.03-13.86.48-18.71,2.62-25.99-10.24-11.18-19.74.58-55.15,5.99-76.78,5.06-20.21,11.38-40.15,17.37-60.08,1.69-.39,3.61-.48,4.84.98.68.81,7.23,17.86,7.72,19.74.43,1.65.82,3.22.57,4.95-7.86,31.01-18.22,61.42-24.22,92.87,24.99-3.89,49.82-9.56,75.27-10.97,26.69-1.48,60.67,1.28,86.48-3.62,12.16-2.31,29.5-15.62,25.86-29.64-1.15-4.41-25.42-25.76-30.48-29.95-2.19-1.81-10.73-9.31-12.65-9.31-26.26,17.18-50.07,41.27-77.82,56.21-18.37,9.89-32.62,14.61-40.33-9.49-4.99-15.6-3.14-30.81,2.49-45.92,6.17-16.55,21.46-34.37,20.59-51.89-.59-11.97-10.21-41.64,4.7-48.08,15.97-6.89,25.39,22.99,32.27,26.5,4.51,2.3,10.24.16,14.18,3.4,3.55,2.92,5.57,12.3,7.76,16.41,3.1,5.82,14.65,15.45,20.32,19.23,6.28,4.18,6.5,3.78,12.5-.47,27.47-19.46,53.24-46.39,80.9-66.33,2.13-1.53,7.12-6.69,9.21-3.95s6.3,25.12,3.92,29.17l-72,58.76-5.01,6.01c19.69,22.45,52.47,44,47.02,78.85-2.07,13.21-9.45,17.12-18.81,24.03-4.75,3.5,6.69,13.37,10.07,16.31,27.34,23.8,42.67,15.81,61.53-11.72,1.98-2.89,20.34-33.08,18.88-34.4-4.38-.02-9.14,2.89-13.22,4.89-12.63,6.18-25.72,13.74-36.22,23.14-4.6,2.83-7.18-8.97-7.59-12.2-1.55-12.22,1.81-15.08,9.23-23.55,11.36-12.97,37.73-28.15,9.35-40.08-7.61-3.2-29.69-6.17-34.02-9.93-2-1.74-11.87-18.94-8.88-20.89,4.41-2.87,27.21,4.61,32.66,6.99,12.38,5.39,31.8,19.85,34.15,33.97,1.44,8.62-4.87,14.7,6.84,10.7,24.55-8.39,46.53-25.57,67.83-39.93l1.85-.1c2.95.92,4.35,17.78,4.04,21.28l1.02,1.75v3.3ZM141.82,172.64c1.94.1,3.85.06,5.78-.27,14.37-2.47,60.58-37.72,73.24-48.72,1.58-1.37,3.32-2.62,4.36-4.5l-1-3.07c-7.56-5.05-14.55-12.56-22.05-17.51-9.9-6.52-17.14-5.3-22.41-17.15-2.14-4.82-5.5-25.18-13.16-13.12-5.43,8.56,1.22,30.86,1.58,41.16.7,19.99-19.81,37.82-25.5,55.78-.81,2.57-1.16,4.7-.86,7.39ZM279.18,271.51c14.43-2.11,17.19-9.95,4.92-18.66l-3.29,7.67-1.63,10.99Z"/>
      <path d="M269.28,448.42c-13.83-4.15-19.47-17.77-24.17-30.19,4.75-3.69,8.31,2.18,15.67.25,11.07-2.91,28.84-32.39,26.97-43.93-1.95-12.09-30.51-31.61-39.31-42.08-2.6-3.09-15.13-20.25-12.11-23.59,1.86-.37,2.9.93,4.27,1.76,11.84,7.14,25.6,20.83,37.6,29.43,18.83,13.49,39.65,28,63.99,27.09,2.98-.7-2.73-16.23-3.33-19.63-9.41-53.32,35.03-54.13,69.99-73.24,4.24-2.32,8.98-5.19,13.06-7.82,3.47-2.23,8.83-8.58,12.73-8.2s10.05,14.97,8.9,18.77c-.84,2.79-12.22,12.47-14.91,15.92-5.11,6.57-21.27,35.67-22.85,43.07-4.27,19.97,29.41,18.82,28.85-1.91,1.96-3.13,4.9,1.61,5.54,3.3,5.32,14.04,4.08,35.03-13.97,37.8-13.94,2.14-19.38-12.87-24.81-22.1-.39-.67-.01-2.15-1.87-1.39-1.58.64-9.57,15.81-11.76,19.02-17.4,25.5-36.28,30.24-64.48,16.54-3.56-1.73-22.61-15.15-24.31-13.59,6.21,16.19,10.51,27.83,3.61,44.81-4.89,12.02-17.2,24.56-28.89,29.9h-4.4ZM391.25,314.38c-21.83,2.91-54.2,22.45-39.01,48.31,17.06-11.54,30.01-29.96,39.01-48.31Z"/>
      <path d="M50.64,77.03l4.32.08c.4,13.7,7.9,28.77,23.74,20.85,9.96-4.98,6.58-15.42,12.11-24.15,12.72-20.08,35.28-38.74,48.83-58.85,7.92-8.21,13.03,6.17,12.67,12.59l-56.06,67.09c-1.17,10.01-.4,21.28-10.09,27.26-23.39,14.43-38.11-27.49-35.52-44.87Z"/>
      <path d="M82.2,245.44c1.93,1.57,4.83,14.96,3.58,16.18-13.82-.67-8.9,6.53-10.01,15.81-3.04,25.36-13.48,48.1-26.55,69.58l-4.07,1.43c-.62-2.07-.95-3.28-.68-5.5,1.67-13.73,12.82-36.47,16.61-51.62,1.23-4.92,3.26-12.37,3.69-17.18,1.31-14.56-3.36-6.53-12.25-8.37-15.65-3.24-15.29-38.89-3.28-41.31,9.64-1.94,17.08,12.12,21.14,19.06l11.82,1.92Z"/>
      <path d="M191.54,339.91c2.51-2.47,23-5.6,26.11-4.11,7.45,3.58.31,32.96,22.26,28.85,3.5-.66,8.97-5.02,10.56-8.11,1.68-3.26.52-7.01,3.98-9.19,3.15,0,5.78,16.01,6.02,19.22,1.75,23.01-23.16,33.06-36.04,11.88-2.09-3.43-5.26-13.9-7.88-15.19-4.78-2.35-17.18,3.85-20.36.58-2.11-2.16-7.07-21.55-4.64-23.93Z"/>
      <path d="M13.29,230.86l-2.26-20.37c14.13-23.77,35.69-42.96,52.33-65.23l5.92-1.78c2.74,1.23,6.91,10.24,6.62,13.17s-26,32.94-30.19,37.98c-3.89,4.68-8.74,9.07-12.62,13.75-3.5,4.21-13.28,19.49-15.89,21.47-1.31.99-2.27,1.3-3.9,1.02Z"/>
      <path d="M292.9,8.19c4.7-.02,9.39,13.76,5.91,17.62l-58.64,70.98c-3.51,0-6.28-21.4-2.77-24.73,15.28-17.92,29.64-38.27,45.61-55.47,1.8-1.94,7.72-8.39,9.9-8.4Z"/>
      <path d="M172.18,365.34c15.48,14.88,59.06,55.86,65.48,73.51.5,1.37,1.19,2.52.86,4.08-3.89.65-7.01-2.58-9.9-4.92-28.39-23.04-52.34-52.08-80.19-75.83-2.55-2.31-7.86-20.13-6.59-21.42,3.03-.45,4.78.56,7.14,2.19,5.82,4.03,17.21,16.63,23.21,22.4Z"/>
      <path d="M374.6,164.75l-4.09.04c-2.86-7.8-3.21-16.78-1.51-24.85l45.71-54.83c6.31-9.16,15.49,4.24,13.06,10.26-16.92,23.7-38.55,44.13-53.17,69.38Z"/>
      <path d="M388.2,439.38c-1.55-1.58-5.34-19.52-4.47-22.09,1.52-4.45,16.5-2.79,20.24-6.19,1.59-2.3-3.92-13.04-1.2-17.63,1.77-3,22.56-5.13,25.77-2.66,3.26,2.51,8.4,19.65,4.96,23.51-3.55,3.99-16.1,1.72-20.91,5.5-1.64,4.58,4.29,15.62-.01,18.64-2.14,1.5-22.41,2.94-24.38.93Z"/>
      <path d="M25.92,356.13c2-.63,2.72.23,3.59,1.89,1.98,3.79.83,10.01,3.71,14.97,5.83,10.03,21.43,7.81,26.03-2.2.94-2.06,1.7-9.93,4.57-8.65,7.67,11.35,9.56,35.49-6.34,40.95-17.72,6.09-27.1-12.59-30.7-26.95-.8-3.17-4.67-18.8-.86-19.99Z"/>
      <path d="M139.64,398.98c6.26,1.23,4.28,10.61,7.24,16.37,5.77,11.24,21.36,9.76,26.68-.57,1.57-3.05.53-8.4,4.52-8.69,4.64,1.9,6.06,20.41,5.4,25.21-1.71,12.4-12.46,18.49-24.39,15.79-12.3-2.78-24.44-36.38-19.45-48.11Z"/>
      <path d="M200.05,4.53c1.95,7.67,1.89,17.14,9.35,21.97,7.13,4.63,17.41.92,21.29-6.19.89-1.64,2.59-12.54,6.15-8.07,2,2.51,4.23,19.86,3.88,23.59-1.2,12.99-14.61,21.6-26.44,15.45-8.76-4.56-15.15-20.96-17-30.24-1-5-4.12-15.3,2.78-16.51Z"/>
      <path d="M15.33,123.33l3.99,9.74c3.36-11.61,19.59-10.42,25.18-1.01s2.83,24.28-7.38,29.81c-19.91,10.77-29.69-24.67-25.93-38.55l4.14.02ZM22.06,136.37c-3.45-1-2.36,3.74-1.93,5.78,1.31,6.29,6.3,9.92,12.26,6.18,2.08-1.31,7.63-9.83,3.33-10.77l-13.06,2.18-.59-3.37Z"/>
      <path d="M21.13,280.14c-5.67-8.79-.86-15.58,9.13-15.26,19.43.61,20.58,33.59,1.29,38.7-17.65,4.67-26.12-27.99-21.56-40.84,2.07-.4,2.72.94,3.52,2.51,2.37,4.62,4.35,21.2,8.09,23.77,9.32,6.42,18.29-10.66,11-10.85-2.69-.07-8.94,3.55-11.46,1.98Z"/>
      <path d="M413.16,208.94c1.41,4.33,5.95,26.4,9.63,27.44,7.15,2.01,11.73-4.49,13.51-10.43-.84-4.12-11.14,2.56-15.16.28-3.92-5.46-4.07-12.68,3.68-13.97,31.64-5.28,24.34,45.46-2.51,36.45-10-3.35-16.23-30.23-12.31-39.74h3.15Z"/>
      <path d="M351.54,77.19c3.16,6.52,3.66,25.65,11.96,27.16,5.37.98,11.36-6.73,10.17-11.93l-14.11.9c-3.76-7.26-4.27-12.35,5.02-13.82,21.31-3.38,26.04,26.87,8.75,36.22-20.35,11-28.31-24.58-26.04-38.69l4.24.16Z"/>
      <path d="M303.08,310.26c3.18-.43,14.38-1.11,16.23.78,1.57,4.01,7.11,22.62,3.87,24.82l-22.64,2.74c-6.62.25-10.43-19.65-9.11-23.51.82-2.39,9.05-4.48,11.64-4.83Z"/>
      <path d="M355.88,415.77c4.14-.2,5.89-1.22,8.13,3.31,1.54,3.12,5.44,20.29,3.68,22.83l-25.61,2.44c-3.42-1.51-8.17-19.7-6.33-23.4,1.71-3.45,16.14-4.97,20.13-5.17Z"/>
      <circle cx="89.08" cy="362.75" r="5.63"/>
      <circle cx="66.01" cy="201.37" r="5.55"/>
      <circle cx="236.59" cy="272.38" r="5.57"/>
      <circle cx="119.59" cy="440.97" r="5.57"/>
      <circle cx="397.48" cy="255.11" r="5.49"/>
      <path d="M159.14,268.49c4.6,4.62-.88,12.6-7.5,9.14-4.31-5.76,2.16-14.5,7.5-9.14Z"/>
      <path d="M59.15,416.82c5.23,5.21-2.78,10.93-8.36,8.36-4.83-6.07,3.04-13.65,8.36-8.36Z"/>
      <path d="M204.3,441.67l-8.64.72c-5.1-5.95.35-12.18,7.26-8.36l1.38,7.64Z"/>
      <circle cx="312.9" cy="442.07" r="5.5"/>
      <circle cx="429.35" cy="119.82" r="5.43"/>
      <path d="M28.49,324.42c4.19,2.64-1.11,14.54-8.35,8.36-5.06-6.09,3.82-11.22,8.35-8.36Z"/>
      <circle cx="436.23" cy="191.16" r="5.42"/>
      <circle cx="69.85" cy="66.13" r="5.36"/>
      <circle cx="248.96" cy="177.88" r="5.36"/>
      <path d="M442.73,316.41c-.92,1.47-8.24,2.13-9.19-.94-2.71-14.8,14.12-6.93,9.19.94Z"/>
      <circle cx="130.22" cy="79.08" r="5.3"/>
      <circle cx="175" cy="19.19" r="5.19"/>
      <path d="M326.26,98.08c4.64,2.9-1.64,14.04-7.26,8.36-4.87-4.92,2.63-11.25,7.26-8.36Z"/>
      <circle cx="36.9" cy="101.9" r="5.07"/>
      <circle cx="12.01" cy="179.08" r="4.29"/>
      <circle cx="186.82" cy="119.38" r="5.45"/>
    </svg>
  );

  useEffect(() => {
    document.title = "مسجد جامع حضرت خدیجه کبرا (س) | پایگاه اطلاع‌رسانی و فرهنگی";
    
    setDailyData({
      ayah: ayahsList[Math.floor(Math.random() * ayahsList.length)],
      hadith: hadithsList[Math.floor(Math.random() * hadithsList.length)],
      hokm: ahkamList[Math.floor(Math.random() * ahkamList.length)]
    });

    const unsubLogo = onSnapshot(doc(db, 'settings', 'logo'), (docSnap) => {
      if(docSnap.exists()) setLogoUrl(docSnap.data().url || '');
      setLoadingStats(prev => ({ ...prev, logo: true }));
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

    return () => { unsubPrayers(); unsubDepts(); unsubSlides(); unsubAnnc(); unsubActs(); unsubArts(); unsubSocials(); unsubFooter(); unsubLogo(); };
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

  const isAppReady = Object.values(loadingStats).every(Boolean);

  if (!isAppReady) {
    return (
      <div className="fixed inset-0 z-[9999] bg-theme-bg flex flex-col justify-center items-center">
        <div className="relative w-32 h-32 mb-8">
          <div className="absolute inset-0 border-4 border-theme-primary border-opacity-20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-theme-accent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center p-5 text-theme-primary">
             {/* استفاده از SVG اختصاصی کاربر در لودینگ */}
             <MosqueLogo />
          </div>
        </div>
        <h2 className="text-xl md:text-3xl font-bold text-theme-text mb-3 tracking-wide">مسجد جامع حضرت خدیجه کبری <span className="text-theme-accent">(س)</span></h2>
        <p className="text-theme-textMuted text-sm md:text-base font-bold animate-pulse">در حال دریافت اطلاعات از سرور...</p>
      </div>
    );
  }

  return (
    <div className="view-section pb-0 overflow-hidden animate-fade-in">

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
                      <div className="inline-flex justify-center items-center gap-2 text-xs md:text-sm text-theme-accent bg-theme-primary bg-opacity-5 px-4 py-2 rounded-xl font-bold">
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

      <footer className="bg-theme-primary text-white relative overflow-hidden mt-8 pt-12">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 pb-12">
          <div>
            <div className="flex items-center gap-3 mb-5">
              {/* استفاده از SVG کاربر در فوتر (سفید شده) */}
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-12 h-12 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
              ) : (
                 <div className="w-12 h-12 text-white opacity-80"><MosqueLogo /></div>
              )}
              <h3 className="font-bold text-2xl text-theme-accent">درباره مسجد</h3>
            </div>
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