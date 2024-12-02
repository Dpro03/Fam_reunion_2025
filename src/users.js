import { db } from './firebase.js';
import {
  collection,
  getDocs,
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

async function fetchAndDisplayUsers() {
  const usersContainer = document.getElementById('usersContainer');
  usersContainer.innerHTML = ''; // Clear existing content

  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      console.log('User data:', userData); // Log the entire user data object


      const phoneNumber = userData.phoneNumber || 'N/A';
      const userElement = document.createElement('div');
      userElement.className = 'bg-slate-800 p-4 rounded-lg mb-4';

      userElement.innerHTML = `
        <h3 class="text-xl font-bold text-white">${
          userData.firstName || 'N/A'
        } ${userData.lastName || 'N/A'}</h3>
        <p class="text-gray-300">Email: ${userData.email || 'N/A'}</p>
        <p class="text-gray-300">Phone: ${
          userData.phone || userData.phoneNumber || 'N/A'
        }</p>
        <p class="text-gray-300">Signed up: ${formatDate(
          userData.createdAt
        )}</p>
      `;
      usersContainer.appendChild(userElement);
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
