// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDHrlpe99aIkG67fkuTSYUR0E_O950DV8A",
  authDomain: "testing-sample-52e9e.firebaseapp.com",
  projectId: "testing-sample-52e9e",
  storageBucket: "testing-sample-52e9e.appspot.com",
  messagingSenderId: "809450801469",
  appId: "1:809450801469:web:13c42e993772f188541d54",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const firestoreDB = getFirestore(app);
export const storage = getStorage();
