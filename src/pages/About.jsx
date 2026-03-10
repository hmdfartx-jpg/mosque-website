import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase';

export default function About() {
  const [departments, setDepartments] = useState([]);
  const [socials, setSocials] = useState({ telegram: '', facebook: '' });
  const [aboutText, setAboutText] = useState('');

  useEffect(() => {
    // خواندن اطلاعات تماس
    const unsubDepts = onSnapshot(collection(db, 'departments'), (snapshot) => {
      setDepartments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => (a.order || 0) - (b.order || 0)));
    });
    // خواندن شبکه‌های اجتماعی و متن درباره ما
    const unsubSettings = onSnapshot(doc(db, 'settings', 'socials'), (docSnap) => {
      if (docSnap.exists()) setSocials(docSnap.data());
    });
    const unsubAbout = onSnapshot(doc(db, 'settings', 'about'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().text) {
        setAboutText(docSnap.data().text);
      } else {
        // متن پیش‌فرض در صورت خالی بودن دیتابیس
        setAboutText("مسجد جامع حضرت خدیجه کبری (سلام الله علیها) یکی از پایگاه‌های مهم عبادی، فرهنگی و اجتماعی در شهر هرات است. این مسجد با هدف ترویج معارف ناب اسلامی، مکتب اهل‌بیت (علیهم السلام) و ایجاد فضایی معنوی برای عبادت و بندگی پروردگار تأسیس شده است.\n\nاهداف و فعالیت‌ها:\n• برگزاری باشکوه نمازهای جماعت و مراسمات مذهبی\n• برگزاری کلاس‌های آموزش قرآن کریم\n• پاسخگویی به سوالات شرعی و مشاوره‌های دینی\n• فعالیت‌های خیریه و کمک به نیازمندان");
      }
    });
    
    return () => { unsubDepts(); unsubSettings(); unsubAbout(); };
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 min-h-screen">
      
      {/* بخش درباره مسجد */}
      <div className="text-center mb-10 border-b border-theme-primary border-opacity-10 pb-6">
        <h1 className="text-3xl font-bold text-theme-text mb-3">درباره و تماس با ما</h1>
        <p className="text-theme-textMuted">معرفی مسجد جامع حضرت خدیجه کبری (س) و راه‌های ارتباطی</p>
      </div>

      <div className="bg-theme-surface border border-theme-primary border-opacity-20 rounded-3xl p-8 md:p-12 shadow-lg relative overflow-hidden mb-12 transition-all duration-500 hover:shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-theme-primary opacity-5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        
        <div className="relative z-10 text-theme-text leading-loose whitespace-pre-line text-justify text-base md:text-lg">
          {aboutText}
        </div>
      </div>

      {/* بخش تماس با بخش‌ها */}
      <h2 className="text-2xl font-bold text-theme-text mb-6 border-r-4 border-theme-accent pr-3">راه‌های ارتباطی بخش‌ها</h2>
      <div className="space-y-6 mb-12">
        {departments.length > 0 ? departments.map(dept => (
          <div key={dept.id} className="bg-theme-surface border border-theme-primary border-opacity-10 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
            <h3 className="text-xl font-bold text-theme-text mb-6">{dept.name}</h3>
            <div className="flex flex-wrap justify-center gap-3 w-full">
              {dept.phones.map((phone, i) => (
                <a key={i} href={`tel:${phone}`} className="flex items-center gap-2 bg-theme-primary text-white px-5 py-3 rounded-xl hover:opacity-80 transition shadow-sm font-bold w-full sm:w-auto justify-center" dir="ltr">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  {phone}
                </a>
              ))}
              {dept.whatsapp && (
                <a href={`https://wa.me/${dept.whatsapp}`} className="flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-3 rounded-xl hover:bg-green-700 transition shadow-sm font-bold w-full sm:w-auto">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.393 0 0 5.392 0 12.031c0 2.115.55 4.183 1.597 6L.065 24l6.103-1.603a12.002 12.002 0 0 0 5.863 1.523h.005c6.637 0 12.03-5.394 12.03-12.031S18.669 0 12.031 0zm..."/></svg>
                  پیام در واتساپ
                </a>
              )}
              {dept.telegram && (
                <a href={`tg://resolve?domain=${dept.telegram}`} className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 transition shadow-sm font-bold w-full sm:w-auto">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15..."/></svg>
                  پیام در تلگرام
                </a>
              )}
            </div>
          </div>
        )) : <p className="text-center text-theme-textMuted py-4">اطلاعات تماسی ثبت نشده است.</p>}
      </div>

      {/* شبکه‌های اجتماعی اصلی */}
      {(socials.telegram || socials.facebook) && (
        <div className="bg-theme-bg border border-theme-primary border-opacity-10 p-8 rounded-3xl shadow-inner text-center">
           <h3 className="font-bold text-lg text-theme-text mb-6">صفحات رسمی مسجد در فضای مجازی</h3>
           <div className="flex flex-wrap justify-center gap-4">
            {socials.telegram && (
              <a href={`https://t.me/${socials.telegram}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-blue-500 text-white px-8 py-3 rounded-xl shadow-md hover:bg-blue-600 hover:-translate-y-1 transition-all font-bold">
                کانال تلگرام
              </a>
            )}
            {socials.facebook && (
              <a href={`https://facebook.com/${socials.facebook}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-blue-800 text-white px-8 py-3 rounded-xl shadow-md hover:bg-blue-900 hover:-translate-y-1 transition-all font-bold">
                صفحه فیسبوک
              </a>
            )}
           </div>
        </div>
      )}
    </div>
  );
}