// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import {
  getFirestore,
  setDoc,
  doc,
  arrayUnion,
  getDoc,
  updateDoc,
  arrayRemove,
  deleteDoc,
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
  deleteObject,
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js'; // Added listAll

// your main JavaScript file
import firebaseConfig from './firebaseConfig.js';


export default firebaseConfig;

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

  // Handle the delete account button click
const deleteAccountButton = document.getElementById('deleteAccountButton');
if (deleteAccountButton) {
  deleteAccountButton.addEventListener('click', async () => {
    const user = auth.currentUser;

    if (!user) {
      console.error('No user is signed in');
      return;
    }

    try {
      // Step 1: Delete user's images from Firebase Storage
      const storageRef = ref(storage, `images/${user.uid}`);
      const result = await listAll(storageRef);
      const deletePromises = result.items.map((item) => deleteObject(ref(storage, item.fullPath)));

      await Promise.all(deletePromises);
      console.log('All user images deleted successfully');

      // Step 2: Delete the user's Firestore document
      const userDocRef = doc(db, 'users', user.uid);
      await deleteDoc(userDocRef);
      console.log('User Firestore document deleted successfully');

      // Step 3: Delete the user's account from Firebase Authentication
      await user.delete();
      console.log('User account deleted successfully');

      // Redirect to a goodbye or login page after account deletion
      window.location.href = './goodbye.html'; // Create a "goodbye" page for confirmation
    } catch (error) {
      console.error('Delete Account Error:', error.message);
      // Handle the case where the user needs to re-authenticate before account deletion
      if (error.code === 'auth/requires-recent-login') {
        alert('You need to re-login before deleting your account. Please log in again.');
        // Optionally, redirect to the login page or force re-authentication
        window.location.href = './logIn.html';
      }
    }
  });
}


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
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
          images: arrayUnion(downloadURL) // Store the image URL in an array field
        }, { merge: true });
  
        console.log('File uploaded successfully:', downloadURL);
  
        // Fetch and display the updated gallery
        fetchImages();
      } catch (error) {
        console.error(`Upload Error: ${error.message}`);
      }
    });
  }

});

// Function to delete image from Firebase Storage and Firestore
// Function to create a delete button
const createDeleteButton = (imagePath) => {
  const deleteButton = document.createElement('button');
  deleteButton.textContent = 'Delete';
  deleteButton.classList.add('absolute', 'top-0', 'right-0', 'bg-red-500', 'text-white', 'p-1', 'rounded');
  
  // Handle the delete action
  deleteButton.addEventListener('click', async () => {
    try {
      const storageRef = ref(storage, imagePath); // Create reference to the image
      await deleteObject(storageRef); // Delete the image from storage
      console.log('Image deleted successfully:', imagePath);

      // Refresh the image gallery after deletion
      fetchImages();
    } catch (error) {
      console.error('Delete Image Error:', error.message);
    }
  });

  return deleteButton;
};

// Function to fetch and display images
const fetchImages = async () => {
  const user = auth.currentUser;
  if (user) {
    const storageRef = ref(storage, `images/${user.uid}`);
    try {
      const result = await listAll(storageRef);
      const photoGallery = document.getElementById('photoGallery');
      if (photoGallery) {
        photoGallery.innerHTML = ''; // Clear previous images
        if (result.items.length === 0) {
          photoGallery.innerHTML = '<p>No images available</p>';
        } else {
          for (const item of result.items) {
            const url = await getDownloadURL(item);
            const img = document.createElement('img');
            img.src = url;
            img.alt = 'Uploaded Image';
            img.classList.add('w-40', 'h-40', 'object-cover', 'rounded', 'shadow');

            // Create and append delete button
            const deleteButton = createDeleteButton(item.fullPath);
            const imgContainer = document.createElement('div');
            imgContainer.classList.add('relative');
            imgContainer.appendChild(img);
            imgContainer.appendChild(deleteButton);
            photoGallery.appendChild(imgContainer);
          }
        }
      }
    } catch (error) {
      console.error('Fetch Images Error:', error.message);
    }
  } else {
    console.error('User is not authenticated');
  }
};

// Ensure the user is authenticated before calling fetchImages
onAuthStateChanged(auth, (user) => {
  const currentPage = window.location.pathname;
  
  // List of pages that require authentication
  const protectedPages = [
    '/2025_reunion.html', // Add any other protected pages here
    // '/anotherProtectedPage.html',
  ];

  if (user) {
    // If the user is authenticated, fetch images for the gallery
    console.log('User is authenticated:', user);
    fetchImages(); // Fetch images once the user is confirmed to be authenticated
  } else {
    // If the user is not authenticated and they are trying to access a protected page
    if (protectedPages.includes(currentPage)) {
      console.error('User is not authenticated, redirecting to login page...');
      window.location.href = './logIn.html'; // Redirect to login page
    }
    // If the current page is the welcome page, do nothing and let them stay
    else {
      console.log('User is not authenticated, staying on the welcome page.');
    }
  }
});

