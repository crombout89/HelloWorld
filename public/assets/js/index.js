document.addEventListener('DOMContentLoaded', () => {
  const welcomeContainer = document.getElementById('welcome');
  
  if (welcomeContainer) {
    console.log('Welcome container found:', welcomeContainer);
    
    const fadeInElements = welcomeContainer.querySelectorAll('.fade-in');
    
    setTimeout(() => {
      console.log('Attempting to make elements visible');
      
      // Add visible class to container first
      welcomeContainer.classList.add('visible');
      
      fadeInElements.forEach((el, index) => {
        console.log(`Adding visible to element ${index}:`, el);
        
        // Stagger the visibility of child elements
        setTimeout(() => {
          el.classList.add('visible');
        }, index * 200);
      });
    }, 4000);
  } else {
    console.error('Welcome container not found');
  }
});