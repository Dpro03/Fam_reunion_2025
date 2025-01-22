
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
  off,
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

// Firebase configuration
import firebaseConfig from './firebaseConfig.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// DOM elements
const foodForm = document.getElementById('foodForm');
const foodList = document.getElementById('foodList');
const pickedItemsList = document.getElementById('pickedItems');

// Food suggestions
const foodSuggestions = [
  'Fried Chicken',
  'Potato Salad',
  'Macaroni and Cheese',
  'Casserole',
  'Hamburgers',
  'HotDogs',
  'Hamburger/Hotdog buns',
  'Crock Pot Dish',
  'Fruit Salad',
  'Pasta Salad',
  'Deviled Eggs',
  'Dessert',
  'Iced Tea',
  'Lemonade',
  'Water',
  'Soda',
  'Chips',
  'Dip',
  'Candy',
  'Popcorn',
  'Pizza',
  'other',
];

// Form handling functions
function getFormData() {
  const checkedBoxes = Array.from(
    document.querySelectorAll('.food-checkbox:checked')
  );
  const otherInput = document.getElementById('otherInput');
  let items = checkedBoxes
    .map((checkbox) => {
      if (checkbox.value === 'other' && otherInput.value.trim()) {
        return otherInput.value.trim();
      }
      return checkbox.value === 'other' ? null : checkbox.value;
    })
    .filter((item) => item !== null);

  return {
    name: document.getElementById('name').value,
    phone: document.getElementById('phone').value,
    attendees: document.getElementById('attendees').value,
    items: items,
  };
}

function validateFormData(formData) {
  const otherCheckbox = document.querySelector('input[value="other"]:checked');
  const otherInput = document.getElementById('otherInput');

  if (!formData.name || !formData.phone || !formData.attendees) {
    alert('Please fill in all required fields.');
    return false;
  }

  if (formData.items.length === 0) {
    alert('Please select at least one item to bring.');
    return false;
  }

  if (otherCheckbox && !otherInput.value.trim()) {
    alert('Please enter your other food item.');
    return false;
  }

  return true;
}

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

function saveSelectionToFirebase(formData, userId) {
  const newEntryRef = push(ref(db, 'foodSelections'));
  set(newEntryRef, {
    ...formData,
    attendees: parseInt(formData.attendees),
    userId: userId,
  })
    .then(() => {
      foodForm.reset();
      const otherInput = document.getElementById('otherInput');
      if (otherInput) {
        otherInput.style.display = 'none';
        otherInput.value = '';
      }
      displayFoodSelections();
    })
    .catch((error) => {
      console.error('Error saving to Firebase:', error);
      alert('Failed to save your selection. Please try again.');
    });
}

// Food list functions
function createFoodCheckboxItem(food) {
  const div = document.createElement('div');
  div.classList.add(
    'flex',
    'items-center',
    'space-x-3',
    'p-2',
    'md:p-3',
    'rounded-lg',
    'bg-gradient-to-br',
    'from-rose-800',
    'via-red-700',
    'to-rose-800',
    'border-2',
    'border-slate-300',
    'shadow-sm',
    'hover:shadow-md',
    'transition-all',
    'duration-200'
  );
  div.innerHTML = `
    <input type="checkbox" id="${food}" value="${food}" class="food-checkbox w-4 h-4 md:w-5 md:h-5 text-blue-500 rounded border-slate-300 focus:ring-blue-700">
    <label for="${food}" class="text-base md:text-lg font-medium text-slate-100 cursor-pointer">${food}</label>
  `;
  return div;
}

function setupFoodForm() {
  const otherInputContainer = document.getElementById('otherInputContainer');
  const otherInput = document.createElement('input');

  // Create and style the other input
  otherInput.type = 'text';
  otherInput.id = 'otherInput';
  otherInput.placeholder = 'Please enter your food item';
  otherInput.classList.add(
    'w-full',
    'px-3',
    'py-2',
    'text-sm',
    'md:text-base',
    'rounded-lg',
    'border-2',
    'border-slate-300',
    'focus:border-blue-500',
    'focus:ring-blue-500',
    'bg-slate-700',
    'text-white',
    'placeholder-slate-400',
    'mt-1',
    'mb-2'
  );

  // Initially hide the other input
  otherInput.style.display = 'none';
  otherInputContainer.appendChild(otherInput);

  // Populate checkboxes
  foodSuggestions.forEach((food) => {
    const div = createFoodCheckboxItem(food);
    foodList.appendChild(div);
  });

  // Add event listener for the "other" checkbox
  const otherCheckbox = document.querySelector('input[value="other"]');
  if (otherCheckbox) {
    otherCheckbox.addEventListener('change', (e) => {
      otherInput.style.display = e.target.checked ? 'block' : 'none';
      if (!e.target.checked) {
        otherInput.value = ''; // Clear the input when unchecked
      }
    });
  }
}

// Display functions
function displayFoodSelections() {
  pickedItemsList.innerHTML = '';
  const foodSelectionsRef = ref(db, 'foodSelections');

  off(foodSelectionsRef);

  onValue(foodSelectionsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      Object.entries(data).forEach(([key, entry]) => {
        const li = createSelectionListItem(entry, key);
        pickedItemsList.appendChild(li);
      });
    } else {
      const emptyMessage = document.createElement('p');
      emptyMessage.classList.add(
        'text-center',
        'text-slate-400',
        'text-lg',
        'italic',
        'py-4'
      );
      emptyMessage.textContent = 'No selections found.';
      pickedItemsList.appendChild(emptyMessage);
    }
  });
}

function createSelectionListItem(entry, key) {
  const li = document.createElement('li');
  li.classList.add(
    'text-sm',
    'md:text-base',
    'font-medium',
    'text-slate-100',
    'flex',
    'flex-col',
    'justify-between',
    'items-start',
    'gap-4',
    'p-3',
    'md:p-4',
    'bg-gradient-to-br',
    'from-slate-900',
    'via-slate-700',
    'to-slate-600',
    'rounded-xl',
    'md:rounded-2xl',
    'shadow-lg',
    'hover:shadow-xl',
    'transition-all',
    'duration-300',
    'border',
    'border-slate-600',
    'hover:border-slate-500'
  );

  // Container for all content
  const contentContainer = document.createElement('div');
  contentContainer.classList.add('space-y-2', 'w-full');

  // User info section
  const userInfo = document.createElement('div');
  userInfo.classList.add(
    'flex',
    'flex-col',
    'sm:flex-row',
    'gap-2',
    'sm:gap-4',
    'flex-wrap'
  );
  userInfo.innerHTML = `
    <span class="font-semibold text-slate-100">${
      entry.name || 'Unknown Name'
    }</span>
    <span class="text-slate-300">📱 ${entry.phone || 'N/A'}</span>
    <span class="text-slate-300">👥 ${entry.attendees || 'N/A'} attending</span>
  `;

  // Items section
  const itemsSection = document.createElement('div');
  itemsSection.classList.add('mt-2');
  itemsSection.innerHTML = `
    <span class="font-bold text-orange-600 text-xl underline underline-offset-3">Bringing:</span>
    <span class="ml-2 text-slate-200 break-words">${
      entry.items && entry.items.length
        ? entry.items.join(', ')
        : 'No items selected'
    }</span>
  `;

  // Remove button
  const removeButton = document.createElement('button');
  removeButton.innerHTML = '🗑️ Remove';
  removeButton.classList.add(
    'bg-red-600',
    'hover:bg-red-700',
    'text-white',
    'px-3',
    'py-1.5',
    'rounded-lg',
    'text-sm',
    'font-medium',
    'transition-colors',
    'w-full',
    'md:w-auto',
    'mt-2',
    'flex',
    'items-center',
    'justify-center',
    'gap-2',
    'h-10'
  );

  const currentUser = auth.currentUser;
  if (currentUser && currentUser.uid === entry.userId) {
    removeButton.style.display = 'inline-flex';
    removeButton.addEventListener('click', () => removeSelection(key));
  } else {
    removeButton.style.display = 'none';
  }

  // Assemble all pieces
  contentContainer.appendChild(userInfo);
  contentContainer.appendChild(itemsSection);
  li.appendChild(contentContainer);
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

// Initialize page styling
document.addEventListener('DOMContentLoaded', () => {
  // Style the main container
  const mainContainer = document.querySelector('main');
  if (mainContainer) {
    mainContainer.classList.add(
      'container',
      'mx-auto',
      'px-4',
      'md:px-6',
      'py-6',
      'max-w-4xl'
    );
  }

  // Style the form
  if (foodForm) {
    foodForm.classList.add(
      'bg-slate-800',
      'rounded-xl',
      'p-4',
      'md:p-6',
      'shadow-lg',
      'mb-8',
      'space-y-4',
      'border-2',
      'border-slate-600'
    );

    // Style form inputs
    const inputs = foodForm.querySelectorAll(
      'input[type="text"], input[type="tel"], input[type="number"]'
    );
    inputs.forEach((input) => {
      input.classList.add(
        'w-full',
        'px-3',
        'py-2',
        'text-sm',
        'md:text-base',
        'rounded-lg',
        'border-2',
        'border-slate-300',
        'focus:border-blue-500',
        'focus:ring-blue-500',
        'bg-slate-700',
        'text-white',
        'placeholder-slate-400'
      );
    });

    // Style form labels
    const labels = foodForm.querySelectorAll('label');
    labels.forEach((label) => {
      label.classList.add(
        'block',
        'text-sm',
        'md:text-base',
        'font-medium',
        'text-slate-100',
        'mb-1',
        'bg-gradient-to-br',
        'from-cyan-500',
        'via-red-400',
        'to-rose-900',
        'p-2',
        'rounded-2xl',
        'shadow-lg',
        'hover:shadow-xl'
      );
    });
  }

  // Style the food list
  if (foodList) {
    foodList.classList.add(
      'grid',
      'grid-cols-1',
      'md:grid-cols-2',
      'lg:grid-cols-3',
      'gap-4',
      'mb-8'
    );
  }

  // Style the picked items list
  if (pickedItemsList) {
    pickedItemsList.classList.add('space-y-4', 'mt-8');
  }
});

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  if (!foodForm || !foodList || !pickedItemsList) {
    console.error('Required DOM elements not found');
    return;
  }

  setupFoodForm();
  foodForm.addEventListener('submit', handleFormSubmission);
});

// Handle authentication state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    foodForm.style.display = 'block';
    displayFoodSelections();
  } else {
    foodForm.style.display = 'none';

    const signInMessage = document.createElement('div');
    signInMessage.classList.add(
      'text-center',
      'p-6',
      'bg-slate-800',
      'rounded-xl',
      'shadow-lg',
      'text-slate-200'
    );
    signInMessage.innerHTML = `
      <p class="text-lg font-medium mb-2">Please sign in</p>
      <p class="text-sm text-slate-400">Sign in to view and manage food selections</p>
    `;
    pickedItemsList.innerHTML = '';
    pickedItemsList.appendChild(signInMessage);
  }
});
