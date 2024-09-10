// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import {
  getFirestore,
  setDoc,
  doc,
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js'; // Added listAll

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
const storage = getStorage(app);

// Ensure the code runs only after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Handle the sign-up form submission
  const signUpForm = document.getElementById('signUpForm');
  if (signUpForm) {
    signUpForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const firstName = document.getElementById('firstName').value;
      const lastName = document.getElementById('lastName').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        // Create user in Firebase Authentication
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

        // Automatically log in the user after successful sign-up
        await signInWithEmailAndPassword(auth, email, password);
        // Redirect after successful sign-up
        window.location.href = './2025_reunion.html';
      } catch (error) {
        const errorMessage = error.message;
        console.error(`Sign Up Error: ${errorMessage}`);
        const errorMessageElement = document.getElementById('error-message');
        if (errorMessageElement) {
          errorMessageElement.textContent = errorMessage;
          errorMessageElement.classList.remove('hidden');
        }
      }
    });
  }

  // Handle the login form submission
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;

      try {
        // Log in user with Firebase Authentication
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        // Redirect after successful login
        window.location.href = './2025_reunion.html';
      } catch (error) {
        const errorMessage = error.message;
        console.error(`Login Error: ${errorMessage}`);
        const errorMessageElement = document.getElementById('error-message');
        if (errorMessageElement) {
          errorMessageElement.textContent = errorMessage;
          errorMessageElement.classList.remove('hidden');
        }
      }
    });
  }

  // Handle the logout button click
  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      try {
        await signOut(auth);
        // Redirect to login page after logout
        window.location.href = './logIn.html';
      } catch (error) {
        console.error(`Logout Error: ${error.message}`);
      }
    });
  }

  // Handle the image upload form submission
  const uploadForm = document.getElementById('uploadForm');
  if (uploadForm) {
    uploadForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const fileInput = document.getElementById('fileInput');
      if (fileInput.files.length === 0) {
        console.error('No file selected');
        return;
      }

      const file = fileInput.files[0];
      const user = auth.currentUser;

      if (!user) {
        console.error('User not logged in');
        return;
      }

      try {
        // Create a reference to the file in Firebase Storage
        const storageRef = ref(storage, `images/${user.uid}/${file.name}`);
        // Upload the file
        await uploadBytes(storageRef, file);
        // Get the file's download URL
        const downloadURL = await getDownloadURL(storageRef);

        // Save the image URL in Firestore
        await setDoc(
          doc(db, 'users', user.uid),
          {
            profilePicture: downloadURL,
          },
          { merge: true }
        );

        console.log('File uploaded successfully:', downloadURL);

        // Fetch and display the updated gallery
        fetchImages();
      } catch (error) {
        console.error(`Upload Error: ${error.message}`);
      }
    });
  }

  // Fetch and display images
  const fetchImages = async () => {
    const user = auth.currentUser;
    if (user) {
      const storageRef = ref(storage, `images/${user.uid}`);
      try {
        const result = await listAll(storageRef); // Using listAll here
        const photoGallery = document.getElementById('photoGallery');
        if (photoGallery) {
          photoGallery.innerHTML = ''; // Clear previous images
          for (const item of result.items) {
            const url = await getDownloadURL(item);
            const img = document.createElement('img');
            img.src = url;
            img.alt = 'Uploaded Image';
            img.classList.add(
              'w-40',
              'h-40',
              'object-cover',
              'rounded',
              'shadow'
            );
            photoGallery.appendChild(img);
          }
        }
      } catch (error) {
        console.error('Fetch Images Error:', error.message);
      }
    } else {
      console.error('User is not authenticated');
    }
  };

  // Call the function to fetch images when the page loads
  fetchImages();
});
