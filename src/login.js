import { auth } from './firebase.js';
import { signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';

document.getElementById('loginForm').addEventListener('submit', function (event) {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Login successful
      alert('Login successful!');
      window.location.href = './welcome.html';
    })
    .catch((error) => {
      // Handle login errors
      document.getElementById('error-message').classList.remove('hidden');
      console.error(error);
    });
});

