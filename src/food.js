// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import {
  getDatabase,
  ref,
  set,
  push,
  onValue,
  remove,
  query,
  orderByChild,
  equalTo,
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDmEgdwk52vVjkm3HnjtDUYBb7hKfOavK4',
  authDomain: 'family-reunion-c8ae6.firebaseapp.com',
  databaseURL: 'https://family-reunion-c8ae6-default-rtdb.firebaseio.com',
  projectId: 'family-reunion-c8ae6',
  storageBucket: 'family-reunion-c8ae6.appspot.com',
  messagingSenderId: '1001898930959',
  appId: '1:1001898930959:web:999f1f873967f528fe447a',
  measurementId: 'G-469H11YLQ9',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Food suggestions
const foodSuggestions = [
  'Fried Chicken',
  'Potato Salad',
  'Macaroni and Cheese',
  'Hamburgers',
  'HotDogs',
  'Hamburger/Hotdog buns',
  'Fruit Salad',
  'Pasta Salad',
  'Deviled Eggs',
  'Chocolate Cake',
  'Apple Pie',
  'Iced Tea',
  'Lemonade',
  'Water',
  'Soda',
  'Chips',
  'Dip',
  'Cookies',
  'Brownies',
  'Cupcakes',
  'Ice Cream',
  'Corned Beef',
];

// DOM elements
const foodList = document.getElementById('foodList');
const foodForm = document.getElementById('foodForm');
const pickedItemsList = document.getElementById('pickedItems');
const clearButton = document.getElementById('clearButton');

// Populate the food checklist
function populateFoodList() {
  foodSuggestions.forEach((food) => {
    const div = createFoodCheckboxItem(food);
    foodList.appendChild(div);
  });
}

function createFoodCheckboxItem(food) {
  const div = document.createElement('div');
  div.classList.add(
    'flex',
    'items-center',
    'space-x-3',
    'p-2',
    'rounded-lg',
    'bg-gradient-to-r',
    'from-pink-600',
    'to-pink-900',
    'hover:bg-gray-300',
    'border-2',
    'border-gray-800',
    'shadow-sm',
    'mb-2'
  );
  div.innerHTML = `
    <input type="checkbox" id="${food}" value="${food}" class="food-checkbox w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500">
    <label for="${food}" class="text-lg font-medium text-black">${food}</label>
  `;
  return div;
}

// Handle form submission
foodForm.addEventListener('submit', handleFormSubmission);

function handleFormSubmission(e) {
  e.preventDefault();
  const formData = getFormData();
  if (!validateFormData(formData)) return;

  const currentUser = auth.currentUser;
  if (!currentUser) {
    alert('You must be signed in to submit a selection.');
    return;
  }

  saveSelectionToFirebase(formData, currentUser.uid);
}

function getFormData() {
  return {
    name: document.getElementById('name').value,
    phone: document.getElementById('phone').value,
    attendees: document.getElementById('attendees').value,
    items: Array.from(document.querySelectorAll('.food-checkbox:checked')).map(
      (checkbox) => checkbox.value
    ),
  };
}

function validateFormData(formData) {
  if (
    !formData.name ||
    !formData.phone ||
    !formData.attendees ||
    formData.items.length === 0
  ) {
    alert('Please fill in all fields and select at least one item.');
    return false;
  }
  return true;
}

function saveSelectionToFirebase(formData, userId) {
  const newEntryRef = push(ref(db, 'foodSelections'));
  set(newEntryRef, {
    ...formData,
    attendees: parseInt(formData.attendees),
    userId: userId,
  })
    .then(() => {
      foodForm.reset();
      displayFoodSelections();
    })
    .catch((error) => {
      console.error('Error saving to Firebase:', error);
      alert('Failed to save your selection. Please try again.');
    });
}

// Display picked items from Firebase
function displayFoodSelections() {
  pickedItemsList.innerHTML = '';
  const foodSelectionsRef = ref(db, 'foodSelections');

  onValue(foodSelectionsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      Object.entries(data).forEach(([key, entry]) => {
        const li = createSelectionListItem(entry, key);
        pickedItemsList.appendChild(li);
      });
    } else {
      pickedItemsList.textContent = 'No selections found.';
    }
  });
}

function createSelectionListItem(entry, key) {
  const li = document.createElement('li');
  li.classList.add(
    'text-lg',
    'font-medium',
    'text-gray-100',
    'flex',
    'justify-between',
    'items-center',
    'mb-4',
    'p-4',
    'bg-gradient-to-r',
    'from-green-800',
    'to-green-500',
    'rounded-3xl',
    'shadow-2xl',
    'shadow-gray-600',
    'hover:scale-105',
    'transition-transform',
    'duration-300',
    'border-3',
    'border-gray-200'
  );

  const selectionText = document.createElement('span');
  selectionText.innerHTML = `
    <strong>${entry.name}</strong> -- phone: (${entry.phone}) -- # Attendees: ${
    entry.attendees
  } <br>
    <span class="inline-flex items-center">
      <span class="font-bold text-red-500 border-b-2 border-gray-600">Bringing --></span>
      <span class="ml-2">${entry.items.join(', ')}</span>
    </span>
  `;

  const removeButton = document.createElement('button');
  removeButton.innerHTML = '🗑️ Remove';
  removeButton.classList.add(
    'bg-red-600',
    'hover:bg-red-700',
    'text-white',
    'px-2',
    'py-1',
    'rounded',
    'ml-4',
    'flex-shrink-0',
    'transition-colors'
  );

  const currentUser = auth.currentUser;
  if (currentUser && currentUser.uid === entry.userId) {
    removeButton.style.display = 'inline-block';
    removeButton.addEventListener('click', () => {
      remove(ref(db, `foodSelections/${key}`))
        .then(() => displayFoodSelections())
        .catch((error) => {
          console.error('Error removing selection:', error);
          alert('Failed to remove selection. Please try again.');
        });
    });
  } else {
    removeButton.style.display = 'none';
  }

  li.appendChild(selectionText);
  li.appendChild(removeButton);
  return li;
}
function removeSelection(key) {
  remove(ref(db, `foodSelections/${key}`))
    .then(() => displayFoodSelections())
    .catch((error) => {
      console.error('Error removing selection:', error);
      alert('Failed to remove selection. Please try again.');
    });
}

// Clear user's food selection
clearButton.addEventListener('click', clearFoodSelection);

function clearFoodSelection() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    alert('You must be signed in to clear your selection.');
    return;
  }

  const foodSelectionsRef = ref(db, 'foodSelections');
  const foodQuery = query(
    foodSelectionsRef,
    orderByChild('userId'),
    equalTo(currentUser.uid)
  );

  onValue(
    foodQuery,
    (snapshot) => {
      const updates = {};
      snapshot.forEach((childSnapshot) => {
        updates[childSnapshot.key] = null;
      });

      set(foodSelectionsRef, updates)
        .then(() => {
          foodForm.reset();
          displayFoodSelections();
          console.log('Food selections removed for user:', currentUser.uid);
        })
        .catch((error) => {
          console.error('Error removing food selections:', error);
          alert('Failed to clear your selections. Please try again.');
        });
    },
    {
      onlyOnce: true,
    }
  );
}

// Handle authentication state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    clearButton.style.display = 'inline-block';
    foodForm.style.display = 'block';
    displayFoodSelections();
  } else {
    clearButton.style.display = 'none';
    foodForm.style.display = 'none';
    pickedItemsList.innerHTML = 'Please sign in to view and manage selections.';
  }
});

// Initialize the page
populateFoodList();
