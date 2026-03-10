import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase';

export default function Contact() {
  const [departments, setDepartments] = useState([]);
  const [socials, setSocials] = useState({ telegram: '', facebook: '' });

  useEffect(() => {
    const unsubDepts = onSnapshot(collection(db, 'departments'), (snapshot) => {
      setDepartments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => (a.order || 0) - (b.order || 0)));
    });
    const unsubSocials = onSnapshot(doc(db, 'settings', 'socials'), (docSnap) => {
      if (docSnap.exists()) setSocials(docSnap.data());
    });
    return () => { unsubDepts(); unsubSocials(); };
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 min-h-screen">
      <div className="text-center mb-10 border-b border-theme-primary border-opacity-10 pb-6">
        <h1 className="text-3xl font-bold text-theme-text mb-3">ارتباط با مسجد</h1>
        <p className="text-theme-textMuted">راه‌های ارتباطی با بخش‌های مختلف مسجد جامع حضرت خدیجه کبری (س)</p>
      </div>

      <div className="space-y-6 mb-12">
        {departments.length > 0 ? departments.map(dept => (
          <div key={dept.id} className="bg-theme-surface border border-theme-primary border-opacity-20 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
            <h2 className="text-2xl font-bold text-theme-text mb-6">{dept.name}</h2>
            <div className="flex flex-wrap justify-center gap-3 w-full">
              {dept.phones.map((phone, i) => (
                <a key={i} href={`tel:${phone}`} className="flex items-center gap-2 bg-theme-primary text-white px-5 py-3 rounded-xl hover:opacity-80 transition shadow-sm font-bold w-full sm:w-auto justify-center" dir="ltr">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  {phone}
                </a>
              ))}
              {dept.whatsapp && (
                <a href={`https://wa.me/${dept.whatsapp}`} className="flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-3 rounded-xl hover:bg-green-700 transition shadow-sm font-bold w-full sm:w-auto">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.393 0 0 5.392 0 12.031c0 2.115.55 4.183 1.597 6L.065 24l6.103-1.603a12.002 12.002 0 0 0 5.863 1.523h.005c6.637 0 12.03-5.394 12.03-12.031S18.669 0 12.031 0zm... (truncated) ..."/></svg>
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
        )) : <p className="text-center text-theme-textMuted py-10">اطلاعات تماسی ثبت نشده است.</p>}
      </div>

      {/* شبکه‌های اجتماعی اصلی */}
      {(socials.telegram || socials.facebook) && (
        <div className="bg-theme-bg border border-theme-primary border-opacity-10 p-6 rounded-2xl shadow-inner text-center">
           <h3 className="font-bold text-lg text-theme-text mb-4">صفحات رسمی مسجد در فضای مجازی</h3>
           <div className="flex flex-wrap justify-center gap-4">
            {socials.telegram && (
              <a href={`https://t.me/${socials.telegram}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-xl shadow hover:bg-blue-600 transition font-bold">
                کانال تلگرام
              </a>
            )}
            {socials.facebook && (
              <a href={`https://facebook.com/${socials.facebook}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-blue-800 text-white px-6 py-3 rounded-xl shadow hover:bg-blue-900 transition font-bold">
                صفحه فیسبوک
              </a>
            )}
           </div>
        </div>
      )}
    </div>
  );
}