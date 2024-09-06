// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { getFirestore, setDoc, doc } from 'firebase/firestore';

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
const auth = getAuth(app);
const db = getFirestore(app);

// Function to ensure code runs only in the browser
document.addEventListener('DOMContentLoaded', () => {
  const signUpForm = document.getElementById('signUpForm');
  if (signUpForm) {
    signUpForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const firstName = document.getElementById('firstName').value;
      const lastName = document.getElementById('lastName').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      try {
        // Create user
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        // Save user data in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          firstName,
          lastName,
          uid: user.uid,
        });

        // Sign in and redirect after successful sign-up
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = './2025_reunion.html'; // Redirect after sign-up
      } catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error(`Error [${errorCode}]: ${errorMessage}`);
        document.getElementById('error-message').textContent = errorMessage;
        document.getElementById('error-message').classList.remove('hidden');
      }
    });

  // Handle login form submission
  document
    .getElementById('loginForm')
    .addEventListener('submit', async (event) => {
      event.preventDefault();

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;
        // Login successful, redirect to the welcome page
        window.location.href = './2025_reunion.html';
      } catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error(`Error [${errorCode}]: ${errorMessage}`);
        document.getElementById('error-message').textContent = errorMessage;
        document.getElementById('error-message').classList.remove('hidden');
      }
    });
}
