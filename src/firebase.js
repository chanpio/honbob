// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database"; // 추가된 import

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAid_7RIEb5b7wbOXI6cR1YJJJM3q_caec",
  authDomain: "honbob-e63e6.firebaseapp.com",
  projectId: "honbob-e63e6",
  storageBucket: "honbob-e63e6.firebasestorage.app",
  messagingSenderId: "125507910790",
  appId: "1:125507910790:web:09010f7825069aeb58a507",
  measurementId: "G-HTS5JHE699"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app); // 데이터베이스 초기화 추가

export { app, analytics, database }; // 필요한 경우 내보내기