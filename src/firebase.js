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
  getDocs,
  collection,
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
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js';

// your main JavaScript file
import firebaseConfig from './firebaseConfig.js';

export default firebaseConfig;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// const db = getFirestore(app);
const storage = getStorage(app);

export const db = getFirestore();

// Signup function
const handleSignup = async function (
  firstName,
  lastName,
  email,
  password,
  phoneNumber
) {
  // Input validation
  if (!firstName || !lastName || !email || !password) {
    alert('Please fill in all required fields');
    return;
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert('Please enter a valid email address');
    return;
  }

  // Password strength validation
  if (password.length < 8) {
    alert('Password must be at least 8 characters long');
    return;
  }

  try {
    // Disable signup button to prevent multiple submissions
    const signupButton = document.getElementById('signupButton');
    if (signupButton) signupButton.disabled = true;

    // Create a new user with email and password
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Update the user's profile with the first and last name
    await updateProfile(user, {
      displayName: `${firstName} ${lastName}`,
    });

    // Save additional user details in Firestore
    const userDoc = doc(db, 'users', user.uid);
    await setDoc(userDoc, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase(),
      phoneNumber: phoneNumber || '', // Optional phone number
      createdAt: new Date(),
      lastLogin: new Date(),
      accountStatus: 'active',
    });

    // Log successful signup
    console.log('User created and data saved in Firestore!');

    // Show success message
    alert('Signup successful! Welcome to the reunion app.');

    // Redirect to login or main page
    window.location.href = './logIn.html';
  } catch (error) {
    // Specific error handling
    let errorMessage = 'Signup failed. Please try again.';

    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage =
          'This email is already registered. Please use a different email or try logging in.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Invalid email address. Please check and try again.';
        break;
      case 'auth/weak-password':
        errorMessage =
          'Password is too weak. Please choose a stronger password.';
        break;
      default:
        errorMessage = error.message;
    }

    // Log the full error for debugging
    console.error('Signup Error:', error);

    // Show user-friendly error message
    alert(errorMessage);
  } finally {
    // Re-enable signup button
    const signupButton = document.getElementById('signupButton');
    if (signupButton) signupButton.disabled = false;
  }
};
// Handle the login form submission
const handleLogin = async (event) => {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = './2025_reunion.html';
  } catch (error) {
    handleError(error);
  }
};

// Handle the logout button click
const handleLogout = async () => {
  try {
    await signOut(auth);
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
    const storageRef = ref(storage, `images/${user.uid}`);
    const result = await listAll(storageRef);
    const deletePromises = result.items.map((item) =>
      deleteObject(ref(storage, item.fullPath))
    );

    await Promise.all(deletePromises);
    console.log('All user images deleted successfully');

    const userDocRef = doc(db, 'users', user.uid);
    await deleteDoc(userDocRef);
    console.log('User Firestore document deleted successfully');

    await user.delete();
    console.log('User account deleted successfully');

    window.location.href = './goodbye.html';
  } catch (error) {
    console.error('Delete Account Error:', error.message);
    if (error.code === 'auth/requires-recent-login') {
      alert(
        'You need to re-login before deleting your account. Please log in again.'
      );
      window.location.href = './logIn.html';
    }
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

// Handle image upload
export const handleUpload = async (event) => {
  try {
    event.preventDefault();

    const fileInput = document.getElementById('fileInput');
    const descriptionInput = document.getElementById('descriptionInput');
    const file = fileInput?.files?.[0];
    const userId = auth.currentUser?.uid; // Use dynamic user ID

    if (!file) {
      console.error('No file selected');
      return;
    }

    if (!userId) {
      console.error('User ID is undefined');
      return;
    }

    const filePath = `images/${file.name}`;
    const storageRef = ref(storage, filePath);
    await uploadBytes(storageRef, file);
    console.log('File uploaded to Firebase Storage');

    const imageUrl = await getDownloadURL(storageRef);
    console.log('File URL:', imageUrl);

    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      await updateDoc(userDocRef, {
        images: arrayUnion({
          url: imageUrl,
          description: descriptionInput.value,
        }),
      });
    } else {
      await setDoc(userDocRef, {
        images: [
          {
            url: imageUrl,
            description: descriptionInput.value,
          },
        ],
      });
    }

    // Refetch images after uploading
    fetchImages();

    console.log('Image uploaded successfully!');
  } catch (error) {
    console.error('Upload Error:', error);
    alert('Upload failed. Check the console for details.');
  }
};

// Check user authentication state
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('User is logged in:', user);
    fetchImages(); // Call fetchImages to display images when user is authenticated
  } else {
    console.log('User is not logged in');
  }
});

// Fetch and display images from Firebase Storage
export const fetchImages = async () => {
  const user = auth.currentUser;
  if (user) {
    try {
      const storageRef = ref(storage, 'images'); // Reference to the images folder
      const result = await listAll(storageRef); // List all images in storage
      const photoGallery = document.getElementById('photoGallery');

      if (photoGallery) {
        photoGallery.innerHTML = ''; // Clear previous images

        if (result.items.length === 0) {
          photoGallery.innerHTML = '<p>No images available</p>';
          return;
        }

        // Fetch all users to get their image descriptions
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        for (const item of result.items) {
          const downloadURL = await getDownloadURL(item); // Get download URL for each image
          const imageDiv = document.createElement('div');
          imageDiv.classList.add('relative', 'mb-4');

          const img = document.createElement('img');
          img.src = downloadURL;
          img.alt = item.name;
          img.classList.add('w-full', 'h-auto', 'rounded');

          // Find description from any user's images
          let descriptionText = 'No description available';
          for (const userData of usersData) {
            const images = userData.images || [];
            const image = images.find((img) => img.url === downloadURL);
            if (image) {
              descriptionText = image.description || 'No description available';
              break; // Stop searching once we find a match
            }
          }

          const description = document.createElement('p');
          description.innerHTML = `#<span class="font-bold text-xl  text-slate-100">${descriptionText}</span>`;
          description.classList.add(
            'mt-2', // Margin top for spacing
            'text-center',
            'text-slate-100',
            'text-xl',
            'font-bold'
          );

          // Append image and description to the gallery
          imageDiv.appendChild(img);
          imageDiv.appendChild(description);
          photoGallery.appendChild(imageDiv);
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
document.addEventListener('DOMContentLoaded', () => {});
document.getElementById('signUpForm')?.addEventListener('submit', handleSignup);
document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
document
  .getElementById('logoutButton')
  ?.addEventListener('click', handleLogout);
document
  .getElementById('deleteAccountButton')
  ?.addEventListener('click', handleDeleteAccount);
document.getElementById('uploadForm')?.addEventListener('submit', handleUpload);