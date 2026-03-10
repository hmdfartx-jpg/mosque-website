import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useParams, Link } from 'react-router-dom';

export default function SingleAnnouncement() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      const docSnap = await getDoc(doc(db, "announcements", id));
      if (docSnap.exists()) {
        setPost({ id: docSnap.id, ...docSnap.data() });
        document.title = `مسجد حضرت خدیجه کبرا (س) | ${docSnap.data().title}`;
      }
      setLoading(false);
    };
    fetchPost();
  }, [id]);

  if (loading) return <div className="min-h-screen flex justify-center items-center"><div className="loader"></div></div>;
  if (!post) return <div className="text-center p-20 font-bold text-theme-text">اطلاعیه یافت نشد.</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 min-h-screen animate-fade-in">
      
      {/* دکمه بازگشت */}
      <div className="mb-6">
        <Link to="/announcements" className="inline-flex items-center gap-2 bg-theme-surface border border-theme-primary border-opacity-20 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-theme-primary hover:text-white transition-all shadow-sm text-theme-text">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          بازگشت به لیست اطلاعیه‌ها
        </Link>
      </div>

      {/* بدنه اصلی اطلاعیه */}
      <div className="bg-theme-surface border border-theme-primary border-opacity-20 rounded-3xl shadow-lg p-5 md:p-8">
        
        {/* ساختار Flexbox: در موبایل ستونی (flex-col) و در دسکتاپ ردیفی (md:flex-row) */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* بخش عکس (سمت راست در دسکتاپ، بالا در موبایل) */}
          {post.imageUrl && (
            <div className="w-full md:w-5/12 lg:w-4/12 flex-shrink-0 bg-theme-bg rounded-2xl border border-theme-primary border-opacity-10 p-3 flex items-center justify-center shadow-inner">
              <img 
                src={post.imageUrl} 
                alt={post.title} 
                className="max-w-full max-h-[500px] object-contain rounded-xl" 
              />
            </div>
          )}

          {/* بخش متن (سمت چپ در دسکتاپ، پایین در موبایل) */}
          <div className="flex-1 w-full">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-theme-text mb-4 leading-relaxed">
              {post.title}
            </h1>
            
            <div className="inline-flex items-center gap-2 text-sm text-theme-accent mb-8 font-bold bg-theme-primary bg-opacity-5 px-4 py-2 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              تاریخ انتشار: {post.date}
            </div>
            
            <div className="text-theme-text text-base md:text-lg leading-[2.5rem] md:leading-[3rem] whitespace-pre-line text-justify">
              {post.content}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}