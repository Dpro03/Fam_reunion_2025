// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  sendPasswordResetEmail,
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
// import { auth, db } from './firebaseConfig.js';

// your main JavaScript file
import firebaseConfig from './firebaseConfig.js';

export default firebaseConfig;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);

export const db = getFirestore();

// Signup function

document.addEventListener('DOMContentLoaded', function () {
  const signUpForm = document.getElementById('signUpForm');

  if (!signUpForm) {
    console.error('SignUp form not found in the DOM');
    return;
  }

  // Prevent adding duplicate event listeners
  if (signUpForm.dataset.listenerAdded === 'true') {
    console.warn('SignUp form event listener already initialized');
    return;
  }

  signUpForm.dataset.listenerAdded = 'true';

  signUpForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent default submission

    // Get form values
    const firstName = document.getElementById('firstName')?.value.trim();
    const lastName = document.getElementById('lastName')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value; // Added confirmPassword check
    const phoneNumber = document.getElementById('phone')?.value.trim();

    // Check for empty fields
    if (!firstName || !lastName || !email || !password || !phoneNumber) {
      alert('Please fill in all fields.');
      return;
    }

    // Check for password mismatch
    if (password !== confirmPassword) {
      alert('Passwords do not match. Please try again.');
      return;
    }

    try {
      // Disable button to prevent duplicate submissions
      const signUpButton = document.getElementById('signUpButton');
      if (signUpButton) signUpButton.disabled = true;

      // Firebase Authentication logic
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Update profile in Firebase Authentication
      await updateProfile(user, {
        displayName: `${firstName} ${lastName} ${phoneNumber}`,
      });

      // Add user data to Firestore
      const userDoc = doc(db, 'users', user.uid);
      await setDoc(userDoc, {
        firstName,
        lastName,
        email: email.toLowerCase(),
        phoneNumber: phoneNumber || null, // Add phone number
        createdAt: new Date(),
        lastLogin: new Date(),
        accountStatus: 'active',
      });

      // Redirect after successful signup
      window.location.href = './2025_reunion.html';
    } catch (error) {
      console.error('Error during signup:', error);
      alert(error.message || 'Signup failed. Please try again.');
    } finally {
      const signUpButton = document.getElementById('signUpButton');
      if (signUpButton) signUpButton.disabled = false;
    }
  });
});

function handleError(error) {
  // Log the error to the console or display a message
  console.error('Error:', error);
  alert('An error occurred: ' + error.message);
}

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
    // Prompt for password to re-authenticate
    const password = prompt(
      'Please enter your password to confirm account deletion:'
    );

    if (!password) {
      alert('Password is required to delete the account.');
      return;
    }

    // Create credential
    const credential = EmailAuthProvider.credential(user.email, password);

    // Re-authenticate the user
    await reauthenticateWithCredential(user, credential);

    // Delete user document from Firestore
    const userDocRef = doc(db, 'users', user.uid);
    await deleteDoc(userDocRef);
    console.log('User Firestore document deleted successfully');

    // Delete the user account
    await deleteUser(user);
    console.log('User account deleted successfully');

    // Redirect to a goodbye page or other actions after deletion
    window.location.href = './goodbye.html';
  } catch (error) {
    console.error('Delete Account Error:', error);

    // Detailed error handling
    switch (error.code) {
      case 'auth/wrong-password':
        alert('Incorrect password. Account deletion cancelled.');
        break;
      case 'auth/requires-recent-login':
        alert('Please log in again before attempting to delete your account.');
        window.location.href = './logIn.html';
        break;
      default:
        alert(
          'An error occurred while deleting the account. Please try again.'
        );
    }
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
      const storage = getStorage();
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
          img.classList.add('w-full', 'h-auto', 'rounded', 'cursor-pointer');
          img.style.maxHeight = '300px'; // Initial thumbnail size
          img.style.objectFit = 'cover';

          // Add click event listener to enlarge image
          img.addEventListener('click', () => {
            const overlay = document.createElement('div');
            overlay.classList.add(
              'fixed',
              'top-0',
              'left-0',
              'w-full',
              'h-full',
              'bg-black',
              'bg-opacity-85',
              'flex',
              'items-center',
              'justify-center',
              'z-50'
            );

            const enlargedImg = document.createElement('img');
            enlargedImg.src = downloadURL;
            enlargedImg.alt = item.name;
            enlargedImg.classList.add('max-w-full', 'max-h-full', 'rounded');

            // Add click listener to close overlay
            overlay.addEventListener('click', () => {
              overlay.remove();
            });

            overlay.appendChild(enlargedImg);
            document.body.appendChild(overlay);
          });

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
          description.innerHTML = `#<span class="font-bold text-xl text-slate-100">${descriptionText}</span>`;
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
// document.getElementById('signUpForm')?.addEventListener('submit', handleSignup);
document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
document
  .getElementById('logoutButton')
  ?.addEventListener('click', handleLogout);
document
  .getElementById('deleteAccountButton')
  ?.addEventListener('click', handleDeleteAccount);
document.getElementById('uploadForm')?.addEventListener('submit', handleUpload);

function resetPassword(email) {
  return sendPasswordResetEmail(auth, email, {
    handleCodeInApp: true,
    url: window.location.origin, // or your specific redirect URL
  });
}

document
  .getElementById('forgotPasswordForm')
  .addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value;
    resetPassword(email)
      .then(() => {
        alert('Password reset email sent. Please check your inbox.');
        document.getElementById('forgotPasswordForm').classList.add('hidden');
        document.getElementById('loginForm').classList.remove('hidden');
      })
      .catch((error) => {
        console.error('Error:', error);
        alert('Error: ' + error.message);
      });
  });
