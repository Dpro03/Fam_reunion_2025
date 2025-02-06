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
  addDoc,
  Timestamp,
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
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
  const maxAttempts = 50; // 5 seconds at 100ms intervals
  let attempts = 0;

  const checkForForm = setInterval(() => {
    attempts++;
    const signUpForm = document.getElementById('signUpForm');

    if (signUpForm) {
      clearInterval(checkForForm);

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
        const confirmPassword =
          document.getElementById('confirmPassword')?.value; // Added confirmPassword check
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
            displayName: `${firstName} ${lastName}`,
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

      console.log('SignUp form event listener initialized successfully');
    } else if (attempts >= maxAttempts) {
      clearInterval(checkForForm);
      console.error('SignUp form not found in the DOM after 5 seconds');
    }
  }, 100);
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
    const user = auth.currentUser;
    let userDisplayName = user?.displayName;

    if (!userDisplayName && user?.email) {
      userDisplayName = user.email.split('@')[0];
      try {
        await updateProfile(user, {
          displayName: userDisplayName,
        });
      } catch (error) {
        console.error('Error updating display name:', error);
      }
    }

    if (!file) {
      console.error('No file selected');
      return;
    }

    if (!user) {
      console.error('User is undefined');
      return;
    }

    // Include timestamp in file path to avoid name conflicts
    const timestamp = Date.now();
    const filePath = `images/${timestamp}_${file.name}`;
    const storageRef = ref(storage, filePath);
    await uploadBytes(storageRef, file);
    console.log('File uploaded to Firebase Storage');

    const imageUrl = await getDownloadURL(storageRef);
    console.log('File URL:', imageUrl);

    // Store image data in Firestore
    const imagesCollectionRef = collection(db, 'images');
    await addDoc(imagesCollectionRef, {
      url: imageUrl,
      description: descriptionInput.value,
      displayName: userDisplayName || 'Anonymous',
      uploadedAt: new Date().toISOString(),
      userId: user.uid,
      fileName: file.name,
      storagePath: filePath,
    });

    // Clear input fields
    fileInput.value = '';
    descriptionInput.value = '';

    // Refetch images after uploading
    fetchImages();

    console.log('Image uploaded successfully!');
  } catch (error) {
    console.error('Upload Error:', error);
    alert('Upload failed. Check the console for details.');
  }
};

export const fetchImages = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('User not logged in, cannot fetch images');
      return;
    }

    const photoGallery = document.getElementById('photoGallery');
    if (!photoGallery) return;

    photoGallery.innerHTML = '';

    // Get all images from Firestore collection
    const imagesCollectionRef = collection(db, 'images');
    const imagesSnapshot = await getDocs(imagesCollectionRef);

    if (imagesSnapshot.empty) {
      photoGallery.innerHTML =
        '<p class="text-center text-slate-300">No images available</p>';
      return;
    }

    // Sort images by upload date (newest first)
    const images = imagesSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    for (const imageData of images) {
      const imageDiv = document.createElement('div');
      imageDiv.classList.add('relative', 'mb-4');

      const img = document.createElement('img');
      img.src = imageData.url;
      img.alt = imageData.fileName || 'Uploaded image';
      img.classList.add('w-full', 'h-auto', 'rounded', 'cursor-pointer');
      img.style.maxHeight = '300px';
      img.style.objectFit = 'cover';

      // Click event listener for enlarging image
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
        enlargedImg.src = imageData.url;
        enlargedImg.alt = imageData.fileName || 'Enlarged image';
        enlargedImg.classList.add('max-w-full', 'max-h-full', 'rounded');

        overlay.addEventListener('click', () => {
          overlay.remove();
        });

        overlay.appendChild(enlargedImg);
        document.body.appendChild(overlay);
      });

      // Create image info container
      const infoContainer = document.createElement('div');
      infoContainer.classList.add('mt-2', 'text-center');

      // Add display name
      const uploaderInfo = document.createElement('p');

      // Ensure displayName exists, then format it
      let displayName = imageData.displayName || 'Unknown User';
      console.log('Original displayName:', imageData.displayName);

      // Add a space between first and last name if it's camelCase (e.g., "JohnDoe" -> "John Doe")
      displayName = displayName.replace(/([a-z])([A-Z])/g, '$1 $2');

      uploaderInfo.innerHTML = `Uploaded by: <span class="font-bold text-xl text-slate-100">
      ${displayName}</span>`;
      uploaderInfo.classList.add('text-slate-300', 'text-md');

      // Add description
      const description = document.createElement('p');
      description.innerHTML = `#<span class="font-bold text-xl text-white">${imageData.description}</span>`;
      description.classList.add('text-slate-100', 'text-xl', 'font-bold');

      // Add upload date
      const dateInfo = document.createElement('p');
      dateInfo.textContent = new Date(
        imageData.uploadedAt
      ).toLocaleDateString();
      dateInfo.classList.add('text-slate-300', 'text-sm');

      // Append all elements
      infoContainer.appendChild(uploaderInfo);
      infoContainer.appendChild(description);
      infoContainer.appendChild(dateInfo);

      imageDiv.appendChild(img);
      imageDiv.appendChild(infoContainer);
      photoGallery.appendChild(imageDiv);
    }
  } catch (error) {
    console.error('Fetch Images Error:', error);
  }
};

// Auth state observer
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('User is logged in:', user);
    fetchImages(); // Fetch images when user is authenticated
  } else {
    console.log('User is not logged in');
    const photoGallery = document.getElementById('photoGallery');
    if (photoGallery) {
      photoGallery.innerHTML =
        '<p class="text-center text-slate-300">Please log in to view images</p>';
    }
  }
});

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

document.addEventListener('DOMContentLoaded', function () {
  const forgotPasswordForm = document.getElementById('forgotPasswordForm');
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const email = document.getElementById('forgotEmail').value;

      if (!email) {
        alert('Please enter a valid email address.');
        return;
      }

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
  } // This closing brace was missing
});

const updateUserDisplayName = async (newDisplayName) => {
  try {
    const user = auth.currentUser;
    if (user) {
      await updateProfile(user, {
        displayName: newDisplayName,
      });
      console.log('Display name updated successfully to:', newDisplayName);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating display name:', error);
    return false;
  }
};
