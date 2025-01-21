// Import the functions you need from the SDKs you need
import {
  initializeApp,
  getApp,
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
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

// Get Firebase configuration from your separate config file
import firebaseConfig from './firebaseConfig.js';

// Initialize Firebase only once
let app;
let auth;
let db;
let storage;

try {
  // Check if Firebase app is already initialized
  app = initializeApp(firebaseConfig);
} catch (error) {
  // If error code is 'app/duplicate-app', get the existing app
  if (error.code === 'app/duplicate-app') {
    app = getApp(); // Get the already initialized app
  } else {
    console.error('Firebase initialization error:', error);
    throw error;
  }
}

// Initialize services
auth = getAuth(app);
db = getFirestore(app);
storage = getStorage(app);

// Export initialized services
export { auth, db, storage };

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
    e.preventDefault();

    const firstName = document.getElementById('firstName')?.value.trim();
    const lastName = document.getElementById('lastName')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    const phoneNumber = document.getElementById('phone')?.value.trim();

    if (!firstName || !lastName || !email || !password || !phoneNumber) {
      alert('Please fill in all fields.');
      return;
    }

    try {
      const signUpButton = document.getElementById('signUpButton');
      if (signUpButton) signUpButton.disabled = true;

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Send email verification
      await sendEmailVerification(user);

      await updateProfile(user, {
        displayName: `${firstName} ${lastName} ${phoneNumber}`,
      });

      const userDoc = doc(db, 'users', user.uid);
      await setDoc(userDoc, {
        firstName,
        lastName,
        email: email.toLowerCase(),
        phoneNumber: phoneNumber || null,
        createdAt: new Date(),
        lastLogin: new Date(),
        accountStatus: 'pending', // Changed to pending until email is verified
        emailVerified: false
      });

      // Show verification message and redirect
      alert('Please check your email to verify your account before proceeding.');
      
      // Optional: Sign out until email is verified
      await signOut(auth);
      
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

// Error handler
function handleError(error) {
  console.error('Error:', error);
  alert('An error occurred: ' + error.message);
}

// Login handler
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

// Logout handler
const handleLogout = async () => {
  try {
    await signOut(auth);
    window.location.href = './logIn.html';
  } catch (error) {
    console.error(`Logout Error: ${error.message}`);
  }
};

// Delete account handler
const handleDeleteAccount = async () => {
  const user = auth.currentUser;

  if (!user) {
    console.error('No user is signed in');
    return;
  }

  try {
    const password = prompt(
      'Please enter your password to confirm account deletion:'
    );

    if (!password) {
      alert('Password is required to delete the account.');
      return;
    }

    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);

    const userDocRef = doc(db, 'users', user.uid);
    await deleteDoc(userDocRef);

    await deleteUser(user);
    window.location.href = './goodbye.html';
  } catch (error) {
    console.error('Delete Account Error:', error);

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

// Image upload handler
export const handleUpload = async (event) => {
  try {
    event.preventDefault();

    const fileInput = document.getElementById('fileInput');
    const descriptionInput = document.getElementById('descriptionInput');
    const file = fileInput?.files?.[0];
    const userId = auth.currentUser?.uid;

    if (!file || !userId) {
      console.error(!file ? 'No file selected' : 'User ID is undefined');
      return;
    }

    const filePath = `images/${file.name}`;
    const storageRef = ref(storage, filePath);
    await uploadBytes(storageRef, file);

    const imageUrl = await getDownloadURL(storageRef);
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

    fetchImages();
  } catch (error) {
    console.error('Upload Error:', error);
    alert('Upload failed. Check the console for details.');
  }
};

// Image fetching function
export const fetchImages = async () => {
  const user = auth.currentUser;
  if (!user) {
    alert('Please log in to view images.');
    return;
  }

  try {
    const storageRef = ref(storage, 'images');
    const result = await listAll(storageRef);
    const photoGallery = document.getElementById('photoGallery');

    if (!photoGallery) return;

    photoGallery.innerHTML = '';

    if (result.items.length === 0) {
      photoGallery.innerHTML = '<p>No images available</p>';
      return;
    }

    const usersSnapshot = await getDocs(collection(db, 'users'));
    const usersData = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    for (const item of result.items) {
      const downloadURL = await getDownloadURL(item);
      const imageDiv = document.createElement('div');
      imageDiv.classList.add('relative', 'mb-4');

      const img = document.createElement('img');
      img.src = downloadURL;
      img.alt = item.name;
      img.classList.add('w-full', 'h-auto', 'rounded', 'cursor-pointer');
      img.style.maxHeight = '300px';
      img.style.objectFit = 'cover';

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

        overlay.addEventListener('click', () => overlay.remove());
        overlay.appendChild(enlargedImg);
        document.body.appendChild(overlay);
      });

      let descriptionText = 'No description available';
      for (const userData of usersData) {
        const images = userData.images || [];
        const image = images.find((img) => img.url === downloadURL);
        if (image) {
          descriptionText = image.description || 'No description available';
          break;
        }
      }

      const description = document.createElement('p');
      description.innerHTML = `#<span class="font-bold text-xl text-slate-100">${descriptionText}</span>`;
      description.classList.add(
        'mt-2',
        'text-center',
        'text-slate-100',
        'text-xl',
        'font-bold'
      );

      imageDiv.appendChild(img);
      imageDiv.appendChild(description);
      photoGallery.appendChild(imageDiv);
    }
  } catch (error) {
    console.error('Fetch Images Error:', error.message);
  }
};

// Auth state observer
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('User is logged in:', user);
    fetchImages();
  } else {
    console.log('User is not logged in');
  }
});

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
  document
    .getElementById('logoutButton')
    ?.addEventListener('click', handleLogout);
  document
    .getElementById('deleteAccountButton')
    ?.addEventListener('click', handleDeleteAccount);
  document
    .getElementById('uploadForm')
    ?.addEventListener('submit', handleUpload);
});

async function resetPassword(email) {
  const auth = getAuth();
  try {
    await sendPasswordResetEmail(auth, email);
    console.log("Password reset email sent successfully");
    alert("Password reset email sent. Check your inbox.");
  } catch (error) {
    console.error("Password reset error:", error);
    
    // Specific error handling
    switch (error.code) {
      case 'auth/invalid-email':
        alert("Invalid email address.");
        break;
      case 'auth/user-not-found':
        alert("No user found with this email address.");
        break;
      default:
        alert("Password reset failed. Please try again.");
    }
  }
}
