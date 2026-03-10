import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase'; // فراخوانی تنظیمات فایربیس که ساختیم

export default function Login({ onNavigate, setIsLoggedIn }) {
  // تعریف وضعیت‌های فرم
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // تابع لاگین به فایربیس
  const handleLogin = async (e) => {
    e.preventDefault(); // جلوگیری از رفرش شدن صفحه
    setError('');
    setLoading(true);

    try {
      // ارسال درخواست ورود به فایربیس
      await signInWithEmailAndPassword(auth, email, password);
      setIsLoggedIn(true); // تایید ورود موفقیت‌آمیز
      onNavigate('admin'); // انتقال به پنل مدیریت
    } catch (err) {
      setError('ایمیل یا رمز عبور اشتباه است!');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <div className="bg-theme-surface rounded-2xl shadow-xl p-8 border border-theme-primary border-opacity-20 text-center">
        <h2 className="text-2xl font-bold text-theme-primary mb-6">ورود به پنل مدیریت</h2>
        
        <form onSubmit={handleLogin}>
          <input 
            type="email" 
            placeholder="ایمیل ادمین" 
            className="w-full p-3 border rounded-lg mb-4 text-center text-gray-800 focus:outline-none focus:ring-2 focus:ring-theme-primary" 
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="رمز عبور" 
            className="w-full p-3 border rounded-lg mb-4 text-center text-gray-800 focus:outline-none focus:ring-2 focus:ring-theme-primary" 
            dir="ltr"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-theme-primary text-white py-3 rounded-lg font-bold hover:bg-opacity-90 transition shadow-md disabled:opacity-50"
          >
            {loading ? 'در حال بررسی...' : 'ورود'}
          </button>
        </form>

        <button 
          onClick={() => onNavigate('home')} 
          className="w-full mt-4 text-theme-textMuted text-sm hover:text-theme-primary transition"
        >
          بازگشت به صفحه اصلی
        </button>

        {/* نمایش ارور در صورت اشتباه بودن رمز */}
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      </div>
    </div>
  );
}