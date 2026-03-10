import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';

export default function PrayersList() {
  const [prayers, setPrayers] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'prayers'), (snapshot) => {
      setPrayers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => (a.order || 0) - (b.order || 0)));
    });
    return () => unsub();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 min-h-screen">
      <div className="text-center mb-10 border-b border-theme-primary border-opacity-10 pb-6">
        <h1 className="text-3xl font-bold text-theme-text mb-3">کتابخانه ادعیه و زیارات</h1>
        <p className="text-theme-textMuted">مجموعه کامل دعاهای ثبت شده در مسجد جامع حضرت خدیجه کبری (س)</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {prayers.length > 0 ? prayers.map(prayer => (
          <Link key={prayer.id} to={`/prayers/${prayer.id}`} className="bg-theme-surface border border-theme-primary border-opacity-20 hover:border-theme-accent transition rounded-2xl p-6 shadow-sm hover:shadow-md flex flex-col items-center justify-center gap-3 text-center group">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-theme-primary opacity-50 group-hover:text-theme-accent group-hover:opacity-100 transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span className="font-bold text-theme-text text-lg">{prayer.title}</span>
            <span className="text-xs text-theme-textMuted bg-theme-bg px-3 py-1 rounded-full">مشاهده متن و ترجمه</span>
          </Link>
        )) : <p className="text-center text-theme-textMuted col-span-full py-10">در حال دریافت اطلاعات...</p>}
      </div>
    </div>
  );
}