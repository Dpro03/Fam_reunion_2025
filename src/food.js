// Import Firebase and Authentication functions (v9+ modular SDK)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getDatabase, ref, set, push, onValue, remove, query, orderByChild, equalTo } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

// Initialize Firebase
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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Food suggestions
const foodSuggestions = [
    "Fried Chicken", "Potato Salad", "Macaroni and Cheese",
    "Hamburgers", "HotDogs", "Hamburger/Hotdog buns",
    "Fruit Salad", "Pasta Salad", "Deviled Eggs",
    "Chocolate Cake", "Apple Pie", "Iced Tea", "Lemonade", "Water",
    "Soda", "Chips", "Dip", "Cookies", "Brownies", "Cupcakes",
];

// Populate the checklist
const foodList = document.getElementById("foodList");
foodSuggestions.forEach((food) => {
    const div = document.createElement("div");
    div.classList.add("flex", "items-center", "space-x-3");
    div.innerHTML = `
      <input type="checkbox" id="${food}" value="${food}" class="food-checkbox">
      <label for="${food}" class="text-lg">${food}</label>
    `;
    foodList.appendChild(div);
});

// Handle form submission
document.getElementById("foodForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const phone = document.getElementById("phone").value;
    const attendees = document.getElementById("attendees").value;
    const selectedItems = Array.from(document.querySelectorAll(".food-checkbox:checked")).map(
        (checkbox) => checkbox.value
    );

    if (!name || !phone || !attendees || selectedItems.length === 0) {
        alert("Please fill in all fields and select at least one item.");
        return;
    }

    // Ensure user is authenticated
    const currentUser = auth.currentUser;
    if (!currentUser) {
        alert("You must be signed in to submit a selection.");
        return;
    }

    // Push data to Firebase
    const newEntryRef = push(ref(db, "foodSelections"));
    set(newEntryRef, {
        name,
        phone,
        attendees: parseInt(attendees),
        items: selectedItems,
        userId: currentUser.uid
    }).then(() => {
        document.getElementById("foodForm").reset();
        displayFoodSelections();  // Refresh the list
    }).catch((error) => {
        console.error("Error saving to Firebase:", error);
        alert("Failed to save your selection. Please try again.");
    });
});

// Display picked items from Firebase
function displayFoodSelections() {
    const pickedItemsList = document.getElementById("pickedItems");
    pickedItemsList.innerHTML = ""; // Clear current list

    // Fetch ALL food selections
    const foodSelectionsRef = ref(db, "foodSelections");

    onValue(foodSelectionsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            Object.entries(data).forEach(([key, entry]) => {
                const li = document.createElement("li");
                li.classList.add("text-lg", "font-medium", "text-gray-700", "flex", "justify-between", "items-center", "mb-2");
                
                // Create the text content with all information
                const selectionText = document.createElement("span");
                selectionText.innerHTML = `
                    <strong>${entry.name}</strong> (${entry.phone}) - ${entry.attendees} people<br>
                    Bringing: ${entry.items.join(", ")}
                `;
                
                // Create remove button
                const removeButton = document.createElement("button");
                removeButton.textContent = "Remove";
                removeButton.classList.add("bg-red-500", "text-white", "px-2", "py-1", "rounded", "ml-4", "hover:bg-red-600", "flex-shrink-0");
                
                // Only add remove functionality if current user matches the selection's user
                const currentUser = auth.currentUser;
                if (currentUser && currentUser.uid === entry.userId) {
                    removeButton.style.display = 'inline-block';
                    removeButton.addEventListener("click", () => {
                        remove(ref(db, `foodSelections/${key}`))
                            .then(() => {
                                displayFoodSelections(); // Refresh the list
                            })
                            .catch((error) => {
                                console.error("Error removing selection:", error);
                                alert("Failed to remove selection. Please try again.");
                            });
                    });
                } else {
                    removeButton.style.display = 'none';
                }

                // Append text first, then button
                li.appendChild(selectionText);
                li.appendChild(removeButton);
                
                pickedItemsList.appendChild(li);
            });
        } else {
            pickedItemsList.textContent = "No selections found.";
        }
    });
}

// Function to clear the user's selection
function clearFoodSelection() {
    const currentUser = auth.currentUser;

    if (currentUser) {
        // Reference to the 'foodSelections' node in Firebase
        const foodSelectionsRef = ref(db, 'foodSelections');

        // Query for the user's selections using their UID
        const foodQuery = query(foodSelectionsRef, orderByChild('userId'), equalTo(currentUser.uid));

        // Start the query to fetch the user's selections
        onValue(foodQuery, (snapshot) => {
            const updates = {};
            snapshot.forEach((childSnapshot) => {
                const childRef = ref(db, `foodSelections/${childSnapshot.key}`);
                updates[childSnapshot.key] = null; // Set to null to remove
            });

            // Perform a single update to remove all user's selections
            set(foodSelectionsRef, updates)
                .then(() => {
                    document.getElementById("foodForm").reset();  // Reset the form
                    displayFoodSelections();  // Update the UI to reflect no selections
                    console.log('Food selections removed for user:', currentUser.uid);
                })
                .catch((error) => {
                    console.error('Error removing food selections:', error);
                    alert('Failed to clear your selections. Please try again.');
                });
        }, (error) => {
            console.error('Error querying food selections:', error);
            alert('An error occurred while clearing selections.');
        });
    } else {
        alert('You must be signed in to clear your selection.');
    }
}

// Add event listener to the clear button
const clearButton = document.getElementById('clearButton');
clearButton.addEventListener('click', clearFoodSelection);

// Add event listener for sign-in state changes
onAuthStateChanged(auth, (user) => {
    const clearButton = document.getElementById('clearButton');
    const foodForm = document.getElementById('foodForm');

    if (user) {
        clearButton.style.display = 'inline-block';  // Show the clear button
        foodForm.style.display = 'block';  // Ensure form is visible
        displayFoodSelections();  // Display selections on sign-in
    } else {
        clearButton.style.display = 'none';  // Hide the clear button if not signed in
        foodForm.style.display = 'none';  // Hide form when not signed in
        document.getElementById("pickedItemsList").innerHTML = "Please sign in to view and manage selections.";
    }
});