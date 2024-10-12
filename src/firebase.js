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

const signUpForm = document.getElementById('signUpForm');
if (signUpForm) {
  // Remove existing listeners
  const clone = signUpForm.cloneNode(true);
  signUpForm.parentNode.replaceChild(clone, signUpForm);

  clone.addEventListener('submit', async (event) => {
    event.preventDefault(); // Ensure this is the first line

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
const handleLogin = async (event) => {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    // Log in user with Firebase Authentication
    await signInWithEmailAndPassword(auth, email, password);
    // Redirect after successful login
    window.location.href = './2025_reunion.html';
  } catch (error) {
    handleError(error);
  }
};

// Handle the logout button click
const handleLogout = async () => {
  try {
    await signOut(auth);
    // Redirect to login page after logout
    window.location.href = './logIn.html';
  } catch (error) {
    console.error(`Logout Error: ${error.message}`);
  }
};

// Handle the delete account button click
const handleDeleteAccount = async () => {
  const user = auth.currentUser;

  if (!user) {
    console.error('No user is signed in');
    return;
  }

  try {
    // Step 1: Delete user's images from Firebase Storage
    const storageRef = ref(storage, `images/${user.uid}`);
    const result = await listAll(storageRef);
    const deletePromises = result.items.map((item) =>
      deleteObject(ref(storage, item.fullPath))
    );

    await Promise.all(deletePromises);
    console.log('All user images deleted successfully');

    // Step 2: Delete the user's Firestore document
    const userDocRef = doc(db, 'users', user.uid);
    await deleteDoc(userDocRef);
    console.log('User Firestore document deleted successfully');

    // Step 3: Delete the user's account from Firebase Authentication
    await user.delete();
    console.log('User account deleted successfully');

    // Redirect to a goodbye page after account deletion
    window.location.href = './goodbye.html'; // Create a "goodbye" page for confirmation
  } catch (error) {
    console.error('Delete Account Error:', error.message);
    // Handle the case where the user needs to re-authenticate before account deletion
    if (error.code === 'auth/requires-recent-login') {
      alert(
        'You need to re-login before deleting your account. Please log in again.'
      );
      window.location.href = './logIn.html';
    }
  }
};

// Handle the image upload
const handleUpload = async (event) => {
  event.preventDefault();

  const fileInput = document.getElementById('fileInput');
  const descriptionInput = document.getElementById('descriptionInput');
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
    const storageRef = ref(storage, `images/${user.uid}/${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    // Save the image URL and description in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, {
      images: arrayUnion({
        url: downloadURL,
        description: descriptionInput.value || '',
      }), // Store both URL and description
    });

    console.log('File uploaded successfully:', downloadURL);
    fetchImages();
  } catch (error) {
    console.error(`Upload Error: ${error.message}`);
  }
};

// General error handling function
const handleError = (error) => {
  console.error(`Error: ${error.message}`);
  const errorMessageElement = document.getElementById('error-message');
  if (errorMessageElement) {
    errorMessageElement.textContent = error.message;
    errorMessageElement.classList.remove('hidden');
  }
};

// Check user authentication state and call fetchImages accordingly
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('User is logged in:', user);
    fetchImages(); // Call fetchImages to display images when user is authenticated
  } else {
    console.log('User is not logged in');
  }
});

// Function to delete image from Firebase Storage and Firestore
const createDeleteButton = (imagePath) => {
  const deleteButton = document.createElement('button');
  deleteButton.textContent = 'Delete';
  deleteButton.classList.add(
    'absolute',
    'top-0',
    'right-0',
    'bg-red-500',
    'text-white',
    'p-1',
    'rounded'
  );

  // Handle the delete action
  deleteButton.addEventListener('click', async () => {
    try {
      const storageRef = ref(storage, imagePath);
      await deleteObject(storageRef);
      console.log('Image deleted successfully:', imagePath);
      fetchImages();
    } catch (error) {
      console.error('Delete Image Error:', error.message);
    }
  });

  return deleteButton;
};

const fetchImages = async () => {
  const user = auth.currentUser;
  if (user) {
    const userDocRef = doc(db, 'users', user.uid);
    try {
      const userDoc = await getDoc(userDocRef);
      const storageRef = ref(storage, `images/${user.uid}`);
      const result = await listAll(storageRef);
      const photoGallery = document.getElementById('photoGallery');
      if (photoGallery) {
        photoGallery.innerHTML = ''; // Clear previous images
        if (result.items.length === 0) {
          photoGallery.innerHTML = '<p>No images available</p>';
        } else {
          const userImages = userDoc.data().images || []; // Get images array from Firestore
          for (const item of result.items) {
            const downloadURL = await getDownloadURL(item);
            const imageDiv = document.createElement('div');
            imageDiv.classList.add('relative', 'mb-4');
            const img = document.createElement('img');
            img.src = downloadURL;
            img.alt = item.name;
            img.classList.add('w-full', 'h-auto', 'rounded');

            // Find the corresponding image description
            const imageData = userImages.find(
              (image) => image.url === downloadURL
            );
            const descriptionText = imageData
              ? imageData.description
              : 'No description available';

            const deleteButton = createDeleteButton(item.fullPath);
            imageDiv.appendChild(img);
            imageDiv.appendChild(deleteButton);

            // Create and append description element
            const description = document.createElement('p');
            description.textContent = `Description: ${descriptionText}`; // Include "Description:"
            description.classList.add(
              'mt-6',
              'text-2xl',
              'text-black',
              'font-bold'
            );

            imageDiv.appendChild(description);
            photoGallery.appendChild(imageDiv);
          }
        }
      }
    } catch (error) {
      console.error('Fetch Images Error:', error.message);
    }
  } else {
    console.log('User not logged in, cannot fetch images');
  }
};

// Add event listeners for forms and buttons
document.getElementById('signUpForm')?.addEventListener('submit', handleSignUp);
document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
document
  .getElementById('logoutButton')
  ?.addEventListener('click', handleLogout);
document
  .getElementById('deleteAccountButton')
  ?.addEventListener('click', handleDeleteAccount);
document.getElementById('uploadForm')?.addEventListener('submit', handleUpload);
