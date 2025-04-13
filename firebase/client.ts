
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDxp17aIcLDjDxJjS3gd2461BtiCuMeNYo",
    authDomain: "prepflow-c04bb.firebaseapp.com",
    projectId: "prepflow-c04bb",
    storageBucket: "prepflow-c04bb.firebasestorage.app",
    messagingSenderId: "1072651099124",
    appId: "1:1072651099124:web:1cd2f69b49a31834fab7a1",
    measurementId: "G-9CDPS9DG12"
};


const app = !getApps.length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);