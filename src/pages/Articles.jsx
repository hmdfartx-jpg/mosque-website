import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';

export default function Articles() {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    document.title = "مسجد جامع حضرت خدیجه کبرا (س) | مقالات و معارف اسلامی";
    const q = query(collection(db, 'articles'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setArticles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 min-h-screen animate-page-transition">
      <div className="text-center mb-10 border-b border-theme-primary border-opacity-10 pb-6">
        <h1 className="text-3xl font-bold text-theme-text mb-3">مقالات و معارف اسلامی</h1>
        <p className="text-theme-textMuted">مطالب مذهبی، احکام، اخلاق و عقاید</p>
      </div>

      <div className="space-y-5">
        {articles.length > 0 ? articles.map(post => (
          <div key={post.id} className="bg-theme-surface border border-theme-primary border-opacity-20 rounded-2xl p-6 shadow-sm hover:shadow-md transition group">
            <h2 className="text-xl md:text-2xl font-bold text-theme-text mb-2 group-hover:text-theme-accent transition-colors">{post.title}</h2>
            <p className="text-xs text-theme-accent mb-4 font-bold">{post.date}</p>
            <p className="text-theme-textMuted text-sm md:text-base mb-4 leading-loose line-clamp-3">{post.summary}</p>
            
            <Link to={`/articles/${post.id}`} className="inline-block mt-2 bg-theme-primary bg-opacity-10 text-theme-primary hover:bg-theme-primary hover:text-white transition-all duration-300 text-sm font-bold px-5 py-2.5 rounded-xl">
              مطالعه کامل مقاله
            </Link>
          </div>
        )) : <p className="text-center text-theme-textMuted py-10 font-bold text-lg">مقاله‌ای ثبت نشده است.</p>}
      </div>
    </div>
  );
}