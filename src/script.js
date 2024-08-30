// script.js

// Wait for the DOM to fully load before running the script
document.addEventListener('DOMContentLoaded', () => {
    // Select the link element by its text content
    const linkElement = document.querySelector('a[href="./2025_reunion.html"]');
  
    // Check if the link element exists
    if (linkElement) {
      // Add a click event listener to the link
      linkElement.addEventListener('click', (event) => {
        // Log a message to the console when the link is clicked
        console.log('Save the Date link was clicked!');
        
        // You can also perform other actions here, such as analytics tracking
        // Prevent the default behavior (navigation) if needed
        // event.preventDefault();
      });
    }
  });
  


