import { auth } from './firebase.js';
import { createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';

document.getElementById('signupForm').addEventListener('submit', function (event) {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signup successful
      alert('Signup successful!');
      window.location.href = './welcome.html';
    })
    .catch((error) => {
      // Handle signup errors
      document.getElementById('error-message').classList.remove('hidden');
      console.error(error);
    });
});
