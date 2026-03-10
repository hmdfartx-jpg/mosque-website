import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useParams, Link } from 'react-router-dom';

export default function SingleActivity() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchPost = async () => {
      const docSnap = await getDoc(doc(db, "activities", id));
      if (docSnap.exists()) {
        const data = docSnap.data();
        // اگر عکس‌ها به صورت آرایه نبودند، عکس تکی را تبدیل به آرایه می‌کنیم
        const images = data.images && data.images.length > 0 ? data.images : (data.imageUrl ? [data.imageUrl] : []);
        setPost({ id: docSnap.id, ...data, images });
        document.title = `مسجد حضرت خدیجه کبرا (س) | ${data.title}`;
      }
      setLoading(false);
    };
    fetchPost();
  }, [id]);

  // تایمر برای حرکت خودکار اسلایدر
  useEffect(() => {
    if (!post || !post.images || post.images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % post.images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [post]);

  if (loading) return <div className="min-h-screen flex justify-center items-center"><div className="loader"></div></div>;
  if (!post) return <div className="text-center p-20 font-bold text-theme-text">برنامه‌ای یافت نشد.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 min-h-screen animate-fade-in">
      
      {/* دکمه بازگشت */}
      <div className="mb-6">
        <Link to="/activities" className="inline-flex items-center gap-2 bg-theme-surface border border-theme-primary border-opacity-20 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-theme-primary hover:text-white transition-all shadow-sm text-theme-text">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          بازگشت به لیست برنامه‌ها
        </Link>
      </div>

      <div className="bg-theme-surface border border-theme-primary border-opacity-20 rounded-3xl overflow-hidden shadow-lg">
        
        {/* اسلایدر تصاویر با گرادیانت */}
        {post.images && post.images.length > 0 && (
          <div className="relative w-full h-72 md:h-[28rem] lg:h-[32rem] overflow-hidden bg-gray-900">
            {post.images.map((img, index) => (
              <img 
                key={index} 
                src={img} 
                alt={`${post.title} - تصویر ${index + 1}`} 
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`} 
              />
            ))}
            
            {/* گرادیانت تاریک از پایین به بالا */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90"></div>
            
            {/* عنوان و خلاصه روی اسلایدر (پایین چین) */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white z-10 flex flex-col justify-end h-full">
              <h1 className="text-2xl md:text-4xl font-bold mb-3 drop-shadow-md text-theme-accent leading-tight">{post.title}</h1>
              <p className="text-sm md:text-lg opacity-90 leading-relaxed drop-shadow-sm max-w-3xl line-clamp-3">{post.summary}</p>
            </div>

            {/* نقطه‌های راهنمای اسلایدر (Dots) */}
            {post.images.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
                {post.images.map((_, i) => (
                  <div key={i} onClick={() => setCurrentSlide(i)} className={`h-2 rounded-full cursor-pointer transition-all duration-500 shadow-sm ${i === currentSlide ? 'w-8 bg-theme-accent' : 'w-2 bg-white bg-opacity-50 hover:bg-opacity-100'}`}></div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* محتوای متنی برنامه */}
        <div className="p-6 md:p-10">
          <div className="inline-flex items-center gap-2 text-sm text-theme-accent mb-8 font-bold bg-theme-primary bg-opacity-5 px-4 py-2 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            تاریخ برگزاری: {post.date}
          </div>
          
          <div className="text-theme-text text-base md:text-lg leading-[2.5rem] md:leading-[3rem] whitespace-pre-line text-justify">
            {post.content}
          </div>
        </div>
      </div>
    </div>
  );
}