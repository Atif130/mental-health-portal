// Sahi Imports: Hum Firebase ko bata rahe hain ki humein kaun-kaun se tools chahiye
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCr0s-3m5Ncbr4aofr0UGEyjCfxFQs82W4",
  authDomain: "mental-health-portal-1c3a4.firebaseapp.com",
  projectId: "mental-health-portal-1c3a4",
  storageBucket: "mental-health-portal-1c3a4.firebasestorage.app",
  messagingSenderId: "116532954136",
  appId: "1:116532954136:web:bfedae55278fbcf220af6d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Ab computer ko pata hai ki getAuth aur getFirestore kya hain, kyonki humne unhe upar import kiya hai
export const auth = getAuth(app);
export const db = getFirestore(app);