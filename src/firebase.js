// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDxCq74bpa_wnPZvWNf9-9CvIEire1-Gyw",
  authDomain: "mosque-app-8917e.firebaseapp.com",
  projectId: "mosque-app-8917e",
  storageBucket: "mosque-app-8917e.firebasestorage.app",
  messagingSenderId: "987396009502",
  appId: "1:987396009502:web:c077b577cf6bf84ebd880f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// فعال‌سازی و خروجی گرفتن از بخش احراز هویت (برای لاگین ادمین)
export const auth = getAuth(app);

// فعال‌سازی و خروجی گرفتن از دیتابیس (برای ذخیره دعاها و تنظیمات)
export const db = getFirestore(app);