import { db } from './firebase.js';
import {
  collection,
  getDocs,
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

import './firebase.js';

async function fetchAndDisplayUsers() {
  const usersContainer = document.getElementById('usersContainer');
  usersContainer.innerHTML = ''; // Clear existing content
  usersContainer.className =
    'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-screen mx-auto gap-8 px-4 justify-center';

  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      console.log('User data:', userData); // Log the entire user data object

      // Check if the user has all required details (not just photo)
      if (userData.firstName && userData.lastName && userData.email) {
        const photoURL = userData.photoURL || ''; // If no photoURL, set to empty string
        const firstName = userData.firstName || '';
        const lastName = userData.lastName || '';
        const email = userData.email || '';
        const phoneNumber = userData.phone || userData.phoneNumber || '';
        const createdAt = userData.createdAt
          ? formatDate(userData.createdAt)
          : '';

        const userElement = document.createElement('div');
        userElement.className =
          'bg-gradient-to-br from-slate-600 via-fuchsia-800 to-slate-600 p-8 rounded-lg shadow-xl border-2 border-slate-200 w-full max-w-md';

        let innerHTML = '';

        // Only add image if photoURL exists
        if (photoURL) {
          innerHTML += `
            <img src="${photoURL}" alt="${firstName} ${lastName}" class="w-24 h-24 rounded-full object-cover mb-4" />
          `;
        }

        // Add user name and other fields only if they exist (no 'N/A' text)
        if (firstName || lastName) {
          innerHTML += `
            <h3 class="p-2 rounded-lg text-xl font-bold text-gray-200 w-auto">${firstName} ${lastName}</h3>
          `;
        }

        if (email) {
          innerHTML += `
            <p class="text-gray-200 text-xl">Email: ${email}</p>
          `;
        }

        if (phoneNumber) {
          innerHTML += `
            <p class="text-gray-200 text-xl">Phone: ${phoneNumber}</p>
          `;
        }

        if (createdAt) {
          innerHTML += `
            <p class="text-gray-200 text-lg">Signed up: ${createdAt}</p>
          `;
        }

        // Assign innerHTML to userElement and append it to the container
        userElement.innerHTML = innerHTML;
        usersContainer.appendChild(userElement);
      }
    });

    if (querySnapshot.empty) {
      usersContainer.innerHTML = '<p class="text-white">No users found.</p>';
    }
  } catch (error) {
    console.error('Error fetching users: ', error);
    usersContainer.innerHTML =
      '<p class="text-red-500">Error fetching users. Please try again later.</p>';
  }
}

function formatDate(timestamp) {
  if (timestamp && timestamp.toDate) {
    return timestamp.toDate().toLocaleString();
  } else if (timestamp instanceof Date) {
    return timestamp.toLocaleString();
  } else {
    return 'Date not available';
  }
}

document.addEventListener('DOMContentLoaded', fetchAndDisplayUsers);
