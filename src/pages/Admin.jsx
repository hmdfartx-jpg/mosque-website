import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, deleteDoc, doc, onSnapshot, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from '../firebase'; 

export default function Admin({ setTheme }) {
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [adminTab, setAdminTab] = useState('prayers'); 
  const [activeForm, setActiveForm] = useState(null); 
  
  const [prayers, setPrayers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [slides, setSlides] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [activities, setActivities] = useState([]); 
  const [articles, setArticles] = useState([]);
  
  const [socials, setSocials] = useState({ telegram: '', facebook: '', whatsapp: '' });
  const [aboutText, setAboutText] = useState(''); 
  const [footerAddress, setFooterAddress] = useState('');
  const [mapLink, setMapLink] = useState(''); // استیت جدید برای لینک گوگل مپ
  const [footerPhone, setFooterPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState(''); 
  const [showFooterAddress, setShowFooterAddress] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const dragItem = useRef();
  const dragOverItem = useRef();

  const [editId, setEditId] = useState(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState(''); 
  const [imageUrl, setImageUrl] = useState(''); 
  const [multipleImages, setMultipleImages] = useState(''); 
  const [content1, setContent1] = useState(''); 
  const [content2, setContent2] = useState(''); 

  const [deptPhone1, setDeptPhone1] = useState('');
  const [deptPhone2, setDeptPhone2] = useState('');
  const [deptPhone3, setDeptPhone3] = useState('');
  const [deptWa, setDeptWa] = useState('');
  const [deptTg, setDeptTg] = useState('');

  useEffect(() => {
    document.title = "مدیریت سایت | مسجد خدیجه کبرا";
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const subs = [
      onSnapshot(collection(db, "prayers"), (snap) => setPrayers(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b)=> (a.order||0)-(b.order||0)))),
      onSnapshot(collection(db, "departments"), (snap) => setDepartments(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b)=> (a.order||0)-(b.order||0)))),
      onSnapshot(collection(db, "slider"), (snap) => setSlides(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b)=> (a.order||0)-(b.order||0)))),
      onSnapshot(collection(db, "announcements"), (snap) => setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b)=> (a.order||0)-(b.order||0)))),
      onSnapshot(collection(db, "activities"), (snap) => setActivities(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b)=> (a.order||0)-(b.order||0)))),
      onSnapshot(collection(db, "articles"), (snap) => setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b)=> (a.order||0)-(b.order||0)))),
      onSnapshot(doc(db, "settings", "socials"), (doc) => { if(doc.exists()) setSocials(doc.data()); }),
      onSnapshot(doc(db, "settings", "about"), (doc) => { if(doc.exists()) setAboutText(doc.data().text || ''); }),
      onSnapshot(doc(db, "settings", "footer"), (doc) => { 
        if(doc.exists()) { 
          setFooterAddress(doc.data().address || ''); 
          setMapLink(doc.data().mapLink || ''); // دریافت لینک نقشه
          setFooterPhone(doc.data().phone || ''); 
          setShowFooterAddress(doc.data().showAddress !== false);
        }
      }),
      onSnapshot(doc(db, "settings", "logo"), (doc) => { if(doc.exists()) setLogoUrl(doc.data().url || ''); }) 
    ];
    return () => subs.forEach(unsub => unsub());
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch(err) {
      setLoginError('ایمیل یا رمز عبور اشتباه است!');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => { await signOut(auth); navigate('/'); };

  const resetForm = () => {
    setEditId(null); setTitle(''); setSubtitle(''); setImageUrl(''); setMultipleImages(''); setContent1(''); setContent2('');
    setDeptPhone1(''); setDeptPhone2(''); setDeptPhone3(''); setDeptWa(''); setDeptTg('');
    setActiveForm(null);
  };

  const openForm = (type, item = null) => {
    resetForm();
    if (item) {
      setEditId(item.id);
      if(type === 'prayers') { setTitle(item.title); setSubtitle(item.description || ''); setContent1(item.content.map(s=>s.a).join('\n')); setContent2(item.content.map(s=>s.p).join('\n')); }
      if(type === 'departments') { setTitle(item.name); setDeptPhone1(item.phones[0]||''); setDeptPhone2(item.phones[1]||''); setDeptPhone3(item.phones[2]||''); setDeptWa(item.whatsapp||''); setDeptTg(item.telegram||''); }
      if(type === 'slider') { setTitle(item.title); setSubtitle(item.subtitle); setImageUrl(item.imageUrl); }
      if(type === 'announcements' || type === 'articles') { setTitle(item.title); setSubtitle(item.summary || ''); setContent1(item.content || ''); setImageUrl(item.imageUrl || ''); }
      if(type === 'activities') { 
        setTitle(item.title); 
        setSubtitle(item.summary || ''); 
        setContent1(item.content || ''); 
        setMultipleImages(item.images ? item.images.join('\n') : (item.imageUrl || '')); 
      }
    }
    setActiveForm(type);
  };

  const saveItem = async (type) => {
    if (!title) return alert('عنوان الزامی است');
    setLoading(true);
    let data = {};
    if (type === 'prayers') {
      const aLines = content1.split('\n').filter(l => l.trim() !== '');
      const pLines = content2.split('\n').filter(l => l.trim() !== '');
      data = { title, description: subtitle, content: aLines.map((l, i) => ({ a: l, p: pLines[i] || "..." })) };
    } 
    else if (type === 'departments') {
      const phones = [deptPhone1, deptPhone2, deptPhone3].filter(p => p.trim() !== '');
      data = { name: title, phones, whatsapp: deptWa.replace('+', ''), telegram: deptTg.replace('@', '') };
    }
    else if (type === 'slider') { data = { title, subtitle, imageUrl }; }
    else if (type === 'announcements' || type === 'articles') { data = { title, summary: subtitle, content: content1, imageUrl, date: new Date().toLocaleDateString('fa-IR') }; }
    else if (type === 'activities') {
      const imagesArray = multipleImages.split('\n').map(url => url.trim()).filter(url => url !== '');
      data = { 
        title, 
        summary: subtitle, 
        content: content1, 
        images: imagesArray, 
        imageUrl: imagesArray.length > 0 ? imagesArray[0] : '', 
        date: new Date().toLocaleDateString('fa-IR') 
      };
    }

    try {
      if (editId) await updateDoc(doc(db, type, editId), data);
      else {
        let length = 0;
        if(type==='prayers') length = prayers.length; if(type==='departments') length = departments.length;
        if(type==='slider') length = slides.length; if(type==='announcements') length = announcements.length;
        if(type==='articles') length = articles.length; if(type==='activities') length = activities.length;
        await addDoc(collection(db, type), { ...data, order: length });
      }
      resetForm();
    } catch(e) { alert('خطا در ذخیره'); } finally { setLoading(false); }
  };

  const handleDelete = async (colName, id) => { if(window.confirm("آیا از حذف مطمئن هستید؟")) await deleteDoc(doc(db, colName, id)); };

  const handleDuplicate = async (colName, item) => {
    try {
      let newItem = { ...item }; delete newItem.id;
      if (newItem.title) newItem.title = `${newItem.title} (کپی)`; if (newItem.name) newItem.name = `${newItem.name} (کپی)`;
      newItem.order = 999; 
      await addDoc(collection(db, colName), newItem);
    } catch (e) { alert("خطا در کپی"); }
  };

  const handleSort = async (collectionName, list) => {
    const copyList = [...list];
    const draggedItem = copyList[dragItem.current];
    copyList.splice(dragItem.current, 1); copyList.splice(dragOverItem.current, 0, draggedItem);
    dragItem.current = null; dragOverItem.current = null;

    if (collectionName === 'prayers') setPrayers(copyList); if (collectionName === 'departments') setDepartments(copyList);
    if (collectionName === 'slider') setSlides(copyList); if (collectionName === 'announcements') setAnnouncements(copyList);
    if (collectionName === 'activities') setActivities(copyList); if (collectionName === 'articles') setArticles(copyList);

    const batch = writeBatch(db);
    copyList.forEach((item, index) => { batch.update(doc(db, collectionName, item.id), { order: index }); });
    await batch.commit();
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "settings", "socials"), { telegram: socials.telegram.replace('@', ''), facebook: socials.facebook, whatsapp: socials.whatsapp.replace('+', '') });
      await setDoc(doc(db, "settings", "about"), { text: aboutText });
      await setDoc(doc(db, "settings", "footer"), { address: footerAddress, mapLink: mapLink, phone: footerPhone, showAddress: showFooterAddress }); 
      await setDoc(doc(db, "settings", "logo"), { url: logoUrl }); 
      alert('تنظیمات با موفقیت ذخیره شد.');
    } catch (error) { alert('خطا در ذخیره‌سازی'); } finally { setLoading(false); }
  };

  if (isAuthChecking) return <div className="min-h-screen flex justify-center items-center bg-gray-100"><div className="loader"></div></div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-200 text-center animate-fade-up">
          <h2 className="text-2xl font-bold text-blue-600 mb-6">ورود به پنل مدیریت</h2>
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="ایمیل ادمین" className="w-full p-3 border border-gray-300 rounded-lg mb-4 text-center focus:ring-2 focus:ring-blue-500 outline-none transition" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="رمز عبور" className="w-full p-3 border border-gray-300 rounded-lg mb-4 text-center focus:ring-2 focus:ring-blue-500 outline-none transition" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-md disabled:opacity-50">
              {loading ? 'در حال بررسی...' : 'ورود'}
            </button>
          </form>
          <button onClick={() => navigate('/')} className="w-full mt-5 text-gray-500 text-sm hover:text-blue-600 transition font-bold">بازگشت به سایت</button>
          {loginError && <p className="text-red-500 text-sm mt-4 font-bold bg-red-50 p-2 rounded">{loginError}</p>}
        </div>
      </div>
    );
  }

  if (activeForm) {
    return (
      <div className="bg-gray-100 min-h-screen pb-12" dir="rtl">
        <div className="max-w-4xl mx-auto px-4 mt-8 animate-fade-in">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h2 className="font-bold text-gray-800 text-xl">{editId ? 'ویرایش اطلاعات' : 'افزودن مورد جدید'}</h2>
              <button onClick={resetForm} className="text-gray-600 hover:text-red-500 font-bold bg-gray-100 hover:bg-red-50 px-4 py-2 rounded-lg transition">انصراف و بازگشت</button>
            </div>
            <div className="space-y-5 text-gray-800">
              {activeForm === 'prayers' && (
                <><input type="text" placeholder="عنوان دعا" className="w-full p-3 border border-gray-300 rounded-lg" value={title} onChange={e => setTitle(e.target.value)} /><textarea placeholder="توضیحات و فضیلت" rows="3" className="w-full p-3 border border-gray-300 rounded-lg" value={subtitle} onChange={e => setSubtitle(e.target.value)}></textarea><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><textarea placeholder="متن عربی" rows="10" className="w-full p-3 border border-gray-300 rounded-lg font-arabic" value={content1} onChange={e => setContent1(e.target.value)}></textarea><textarea placeholder="ترجمه فارسی" rows="10" className="w-full p-3 border border-gray-300 rounded-lg" value={content2} onChange={e => setContent2(e.target.value)}></textarea></div></>
              )}
              {activeForm === 'departments' && (
                <><input type="text" placeholder="نام بخش" className="w-full p-3 border border-gray-300 rounded-lg" value={title} onChange={e => setTitle(e.target.value)} /><div className="grid grid-cols-1 md:grid-cols-3 gap-3"><input type="tel" placeholder="شماره تماس ۱" className="w-full p-3 border border-gray-300 rounded-lg" dir="ltr" value={deptPhone1} onChange={e => setDeptPhone1(e.target.value)} /><input type="tel" placeholder="شماره تماس ۲" className="w-full p-3 border border-gray-300 rounded-lg" dir="ltr" value={deptPhone2} onChange={e => setDeptPhone2(e.target.value)} /><input type="tel" placeholder="شماره تماس ۳" className="w-full p-3 border border-gray-300 rounded-lg" dir="ltr" value={deptPhone3} onChange={e => setDeptPhone3(e.target.value)} /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><input type="tel" placeholder="شماره واتساپ" className="w-full p-3 border border-gray-300 rounded-lg" dir="ltr" value={deptWa} onChange={e => setDeptWa(e.target.value)} /><input type="text" placeholder="آیدی تلگرام" className="w-full p-3 border border-gray-300 rounded-lg" dir="ltr" value={deptTg} onChange={e => setDeptTg(e.target.value)} /></div></>
              )}
              {activeForm === 'slider' && (
                <><input type="text" placeholder="عنوان بزرگ" className="w-full p-3 border border-gray-300 rounded-lg" value={title} onChange={e => setTitle(e.target.value)} /><input type="text" placeholder="متن زیر عنوان" className="w-full p-3 border border-gray-300 rounded-lg" value={subtitle} onChange={e => setSubtitle(e.target.value)} /><input type="text" placeholder="لینک عکس" className="w-full p-3 border border-gray-300 rounded-lg text-left" dir="ltr" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />{imageUrl && <img src={imageUrl} alt="preview" className="h-32 object-cover rounded-lg" />}</>
              )}
              {(activeForm === 'announcements' || activeForm === 'articles') && (
                <><input type="text" placeholder="عنوان" className="w-full p-3 border border-gray-300 rounded-lg font-bold" value={title} onChange={e => setTitle(e.target.value)} /><input type="text" placeholder="لینک تصویر شاخص" className="w-full p-3 border border-gray-300 rounded-lg text-left" dir="ltr" value={imageUrl} onChange={e => setImageUrl(e.target.value)} /><textarea placeholder="خلاصه کوتاه" rows="2" className="w-full p-3 border border-gray-300 rounded-lg" value={subtitle} onChange={e => setSubtitle(e.target.value)}></textarea><textarea placeholder="متن کامل..." rows="8" className="w-full p-3 border border-gray-300 rounded-lg leading-loose" value={content1} onChange={e => setContent1(e.target.value)}></textarea></>
              )}
              {activeForm === 'activities' && (
                <>
                  <input type="text" placeholder="عنوان برنامه / فعالیت" className="w-full p-3 border border-gray-300 rounded-lg font-bold" value={title} onChange={e => setTitle(e.target.value)} />
                  <textarea placeholder="لینک عکس‌های برنامه (هر لینک در یک خط جدید)" rows="3" className="w-full p-3 border border-gray-300 rounded-lg text-left" dir="ltr" value={multipleImages} onChange={e => setMultipleImages(e.target.value)}></textarea>
                  <textarea placeholder="خلاصه کوتاه (نمایش در صفحه اصلی)" rows="2" className="w-full p-3 border border-gray-300 rounded-lg" value={subtitle} onChange={e => setSubtitle(e.target.value)}></textarea>
                  <textarea placeholder="گزارش و متن کامل برنامه..." rows="8" className="w-full p-3 border border-gray-300 rounded-lg leading-loose" value={content1} onChange={e => setContent1(e.target.value)}></textarea>
                </>
              )}
              <button onClick={() => saveItem(activeForm)} disabled={loading} className="w-full bg-blue-600 text-white py-3.5 rounded-lg font-bold text-lg hover:bg-blue-700 transition mt-6 shadow-md">
                {loading ? 'در حال ذخیره...' : 'ذخیره اطلاعات'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderList = (list, collectionName) => (
    <div className="space-y-3 mt-4 animate-fade-in">
      {list.length === 0 ? <p className="text-gray-500 text-center py-6">موردی یافت نشد.</p> : list.map((item, index) => (
        <div key={item.id} draggable onDragStart={(e) => dragItem.current = index} onDragEnter={(e) => dragOverItem.current = index} onDragEnd={() => handleSort(collectionName, list)} onDragOver={(e) => e.preventDefault()} className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 hover:bg-blue-50 cursor-move transition group">
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-xl">⣿</span>
            {(item.imageUrl || (item.images && item.images.length > 0)) && <img src={item.images ? item.images[0] : item.imageUrl} className="w-12 h-12 object-cover rounded-md" alt="" />}
            <div><strong className="text-gray-800 block text-sm md:text-base">{item.title || item.name}</strong></div>
          </div>
          <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition">
            <button onClick={() => openForm(collectionName, item)} className="text-blue-600 bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold">ویرایش</button>
            <button onClick={() => handleDuplicate(collectionName, item)} className="text-green-700 bg-green-100 px-3 py-1.5 rounded-lg text-xs font-bold">کپی</button>
            <button onClick={() => handleDelete(collectionName, item.id)} className="text-red-600 bg-red-100 px-3 py-1.5 rounded-lg text-xs font-bold">حذف</button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="pb-12 bg-gray-100 min-h-screen font-sans" dir="rtl">
      <header className="bg-gray-900 text-white p-4 shadow-md sticky top-0 z-20 flex justify-between items-center">
        <h1 className="font-bold text-lg">داشبورد مدیریت</h1>
        <div className="flex gap-4">
          <button onClick={() => navigate('/')} className="text-gray-300 hover:text-white text-sm font-bold">مشاهده سایت</button>
          <button onClick={handleLogout} className="bg-red-600 px-4 py-2 rounded-lg text-sm font-bold">خروج</button>
        </div>
      </header>
    
      <div className="max-w-6xl mx-auto px-4 mt-8 animate-fade-up">
        <div className="flex overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-200 mb-6 font-bold text-sm">
          <button onClick={() => setAdminTab('prayers')} className={`flex-1 py-4 px-4 whitespace-nowrap border-b-4 transition ${adminTab === 'prayers' ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-transparent text-gray-500'}`}>ادعیه</button>
          <button onClick={() => setAdminTab('departments')} className={`flex-1 py-4 px-4 whitespace-nowrap border-b-4 transition ${adminTab === 'departments' ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-transparent text-gray-500'}`}>بخش‌ها</button>
          <button onClick={() => setAdminTab('slider')} className={`flex-1 py-4 px-4 whitespace-nowrap border-b-4 transition ${adminTab === 'slider' ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-transparent text-gray-500'}`}>اسلایدر</button>
          <button onClick={() => setAdminTab('announcements')} className={`flex-1 py-4 px-4 whitespace-nowrap border-b-4 transition ${adminTab === 'announcements' ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-transparent text-gray-500'}`}>اطلاعیه‌ها</button>
          <button onClick={() => setAdminTab('activities')} className={`flex-1 py-4 px-4 whitespace-nowrap border-b-4 transition ${adminTab === 'activities' ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-transparent text-gray-500'}`}>برنامه‌ها</button>
          <button onClick={() => setAdminTab('articles')} className={`flex-1 py-4 px-4 whitespace-nowrap border-b-4 transition ${adminTab === 'articles' ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-transparent text-gray-500'}`}>مقالات</button>
          <button onClick={() => setAdminTab('settings')} className={`flex-1 py-4 px-4 whitespace-nowrap border-b-4 transition ${adminTab === 'settings' ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-transparent text-gray-500'}`}>تنظیمات سایت</button>
        </div>

        <div className="bg-transparent min-h-[50vh]">
          {adminTab === 'prayers' && <div className="bg-white rounded-3xl shadow-sm p-6 border"><div className="flex justify-between items-center border-b pb-4"><h2 className="font-bold text-xl">ادعیه و زیارات</h2><button onClick={() => openForm('prayers')} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold">+ افزودن</button></div>{renderList(prayers, 'prayers')}</div>}
          {adminTab === 'departments' && <div className="bg-white rounded-3xl shadow-sm p-6 border"><div className="flex justify-between items-center border-b pb-4"><h2 className="font-bold text-xl">بخش‌های پاسخگویی</h2><button onClick={() => openForm('departments')} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold">+ افزودن</button></div>{renderList(departments, 'departments')}</div>}
          {adminTab === 'slider' && <div className="bg-white rounded-3xl shadow-sm p-6 border"><div className="flex justify-between items-center border-b pb-4"><h2 className="font-bold text-xl">اسلایدر هیرو</h2><button onClick={() => openForm('slider')} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold">+ افزودن</button></div>{renderList(slides, 'slider')}</div>}
          {adminTab === 'announcements' && <div className="bg-white rounded-3xl shadow-sm p-6 border"><div className="flex justify-between items-center border-b pb-4"><h2 className="font-bold text-xl">تابلو اعلانات</h2><button onClick={() => openForm('announcements')} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold">+ افزودن</button></div>{renderList(announcements, 'announcements')}</div>}
          {adminTab === 'activities' && <div className="bg-white rounded-3xl shadow-sm p-6 border"><div className="flex justify-between items-center border-b pb-4"><h2 className="font-bold text-xl">برنامه‌ها و فعالیت‌ها</h2><button onClick={() => openForm('activities')} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold">+ افزودن</button></div>{renderList(activities, 'activities')}</div>}
          {adminTab === 'articles' && <div className="bg-white rounded-3xl shadow-sm p-6 border"><div className="flex justify-between items-center border-b pb-4"><h2 className="font-bold text-xl">مقالات معارفی</h2><button onClick={() => openForm('articles')} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold">+ افزودن</button></div>{renderList(articles, 'articles')}</div>}

          {adminTab === 'settings' && (
            <div className="space-y-6">
             
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
                <h2 className="font-bold text-gray-800 mb-4 border-b pb-3 text-xl">لوگوی رسمی سایت</h2>
                <p className="text-sm text-gray-500 mb-3">یک عکس با پس‌زمینه شفاف (PNG) را در سایت‌هایی مثل Imgur آپلود کنید و لینک آن را اینجا قرار دهید.</p>
                <div className="flex gap-4 items-center">
                  <input type="text" placeholder="لینک مستقیم لوگو (مثال: https://.../logo.png)" className="flex-1 p-3 border rounded-xl" dir="ltr" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} />
                  {logoUrl && <img src={logoUrl} alt="Logo Preview" className="w-16 h-16 object-contain bg-gray-100 rounded-xl border p-1" />}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
                <h2 className="font-bold text-gray-800 mb-6 border-b pb-3 text-xl">تغییر قالب سایت</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button onClick={() => setTheme('normal')} className="p-4 rounded-xl border-2 border-[#006666] bg-[#FDFBF0] text-[#006666] font-bold text-lg hover:shadow-md transition">تم عمومی</button>
                  <button onClick={() => setTheme('joyful')} className="p-4 rounded-xl border-2 border-[#10b981] bg-[#f0fdf4] text-[#10b981] font-bold text-lg hover:shadow-md transition">تم اعیاد</button>
                  <button onClick={() => setTheme('mourning')} className="p-4 rounded-xl border-2 border-[#1a1a1a] bg-[#262626] text-[#b8973b] font-bold text-lg hover:shadow-md transition">تم عزاداری</button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 space-y-4">
                  <h2 className="font-bold text-gray-800 border-b pb-3 text-xl">لینک‌های شبکه‌های اجتماعی</h2>
                  <input type="text" placeholder="آیدی تلگرام (بدون @)" className="w-full p-3 border rounded-xl" dir="ltr" value={socials.telegram} onChange={e => setSocials({...socials, telegram: e.target.value})} />
                  <input type="text" placeholder="لینک فیسبوک" className="w-full p-3 border rounded-xl" dir="ltr" value={socials.facebook} onChange={e => setSocials({...socials, facebook: e.target.value})} />
                  <input type="tel" placeholder="شماره واتساپ فوتر" className="w-full p-3 border rounded-xl" dir="ltr" value={socials.whatsapp} onChange={e => setSocials({...socials, whatsapp: e.target.value})} />
                  
                  <div className="flex justify-between items-center border-b pb-3 pt-4 mb-4">
                    <h2 className="font-bold text-gray-800 text-xl">تنظیمات فوتر سایت</h2>
                    <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-1.5 rounded-lg border hover:bg-gray-100 transition">
                      <span className="text-sm font-bold text-gray-700">نمایش آدرس</span>
                      <input type="checkbox" checked={showFooterAddress} onChange={e => setShowFooterAddress(e.target.checked)} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                    </label>
                  </div>
                  
                  <input type="text" placeholder="آدرس مسجد" className={`w-full p-3 border rounded-xl ${!showFooterAddress ? 'bg-gray-100 opacity-60' : ''}`} value={footerAddress} onChange={e => setFooterAddress(e.target.value)} disabled={!showFooterAddress} />
                  <input type="text" placeholder="لینک گوگل مپ (موقعیت روی نقشه)" className="w-full p-3 border rounded-xl" dir="ltr" value={mapLink} onChange={e => setMapLink(e.target.value)} />
                  <input type="tel" placeholder="شماره تماس اصلی مسجد" className="w-full p-3 border rounded-xl" dir="ltr" value={footerPhone} onChange={e => setFooterPhone(e.target.value)} />
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
                  <h2 className="font-bold text-gray-800 mb-4 border-b pb-3 text-xl">متن صفحه «درباره ما»</h2>
                  <textarea rows="14" className="w-full p-3 border rounded-xl leading-loose" value={aboutText} onChange={e => setAboutText(e.target.value)} placeholder="متن معرفی مسجد را بنویسید..."></textarea>
                </div>
              </div>

              <div className="bg-white p-4 rounded-3xl shadow-sm border">
                <button onClick={handleSaveSettings} disabled={loading} className="bg-blue-600 text-white px-4 py-4 rounded-xl w-full font-bold text-lg hover:bg-blue-700 transition">
                    {loading ? 'در حال ذخیره...' : 'ذخیره تمام تنظیمات'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}