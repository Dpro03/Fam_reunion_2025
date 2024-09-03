// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDmEgdwk52vVjkm3HnjtDUYBb7hKfOavK4',
  authDomain: 'family-reunion-c8ae6.firebaseapp.com',
  projectId: 'family-reunion-c8ae6',
  storageBucket: 'family-reunion-c8ae6.appspot.com',
  messagingSenderId: '1001898930959',
  appId: '1:1001898930959:web:999f1f873967f528fe447a',
  measurementId: 'G-469H11YLQ9',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
