// import { db, handleLogin, sendPasswordResetEmail } from './firebase.js';
// import {
//   collection,
//   getDocs,
// } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// import './firebase.js';
      
//       // Password visibility toggle functionality
      
//       function togglePasswordVisibility() {
//         const passwordInput = document.getElementById('loginPassword');
//         passwordInput.type =
//           passwordInput.type === 'password' ? 'text' : 'password';
//       }
//       document.addEventListener('DOMContentLoaded', function () {

//       // Forgot password functionality
//       document
//         .getElementById('forgotPasswordLink')
//         .addEventListener('click', function (e) {
//           e.preventDefault();
//           document.getElementById('loginForm').classList.add('hidden');
//           document
//             .getElementById('forgotPasswordForm')
//             .classList.remove('hidden');
//         });

//       document
//         .getElementById('backToLoginLink')
//         .addEventListener('click', function (e) {
//           e.preventDefault();
//           document
//             .getElementById('forgotPasswordForm')
//             .classList.add('hidden');
//           document.getElementById('loginForm').classList.remove('hidden');          });

//       document
//         .getElementById('forgotPasswordForm')
//         .addEventListener('submit', function (e) {
//           e.preventDefault();
//           const email = document.getElementById('forgotEmail').value;
//           // Here you would typically call a function to handle the password reset
//           // For example: sendPasswordResetEmail(email);
//           alert('Password reset email sent to ' + email);
//         });
//     });

//     // Add event listeners for forms and buttons
//     document.addEventListener('DOMContentLoaded', () => {});
//     // document.getElementById('signUpForm')?.addEventListener('submit', handleSignup);
//     document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
//     document
//       .getElementById('logoutButton')
//       ?.addEventListener('click', handleLogout);
//     document
//       .getElementById('deleteAccountButton')
//       ?.addEventListener('click', handleDeleteAccount);
//     document.getElementById('uploadForm')?.addEventListener('submit', handleUpload);
    
//     function resetPassword(email) {
//       return sendPasswordResetEmail( email, {
//         handleCodeInApp: true,
//         url: window.location.origin, // or your specific redirect URL
//       });
//     }
    
//     document.addEventListener('DOMContentLoaded', function () {
//       document
//         .getElementById('forgotPasswordForm')
//         .addEventListener('submit', function (e) {
//           e.preventDefault();
//           const email = document.getElementById('forgotEmail').value;
    
//           if (!email) {
//             alert('Please enter a valid email address.');
//             return;
//           }
    
//           resetPassword(email)
//             .then(() => {
//               alert('Password reset email sent. Please check your inbox.');
//               document.getElementById('forgotPasswordForm').classList.add('hidden');
//               document.getElementById('loginForm').classList.remove('hidden');
//             })
//             .catch((error) => {
//               console.error('Error:', error);
//               alert('Error: ' + error.message);
//             });
//         });
//     });
    
