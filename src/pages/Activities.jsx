import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';

export default function Activities() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    document.title = "مسجد حضرت خدیجه کبرا (س) | برنامه‌ها و فعالیت‌ها";
    const q = query(collection(db, 'activities'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 min-h-screen animate-page-transition">
      <div className="text-center mb-10 border-b border-theme-primary border-opacity-10 pb-6">
        <h1 className="text-3xl font-bold text-theme-text mb-3">برنامه‌ها و فعالیت‌های فرهنگی</h1>
        <p className="text-theme-textMuted">گزارش برنامه‌ها، کلاس‌ها و مراسمات برگزار شده</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {activities.length > 0 ? activities.map(post => (
          <div key={post.id} className="flex bg-theme-surface border border-theme-primary border-opacity-10 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition group h-auto md:h-56">
            
            {/* قاب عکس - گرفتن اولین عکس از آرایه تصاویر یا تک عکس */}
            {(post.imageUrl || (post.images && post.images.length > 0)) && (
              <div className="w-32 md:w-48 bg-theme-bg border-l border-theme-primary border-opacity-10 flex items-center justify-center p-2 flex-shrink-0">
                <img src={post.images && post.images.length > 0 ? post.images[0] : post.imageUrl} className="max-w-full max-h-full object-contain rounded-lg transition-transform duration-500 group-hover:scale-105" alt={post.title} />
              </div>
            )}

            <div className="p-5 flex-1 flex flex-col justify-center text-right overflow-hidden">
              <h2 className="text-lg md:text-xl font-bold text-theme-text mb-2 truncate">{post.title}</h2>
              <p className="text-xs text-theme-accent mb-3 font-bold">{post.date}</p>
              <p className="text-theme-textMuted text-sm line-clamp-3 leading-loose">{post.summary}</p>
              
              <Link to={`/activities/${post.id}`} className="inline-block mt-4 bg-theme-primary text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow hover:bg-opacity-80 transition self-end">
                مشاهده کامل گزارش
              </Link>
            </div>
          </div>
        )) : <p className="text-center text-theme-textMuted col-span-full py-10 font-bold text-lg">فعالیتی ثبت نشده است.</p>}
      </div>
    </div>
  );
}