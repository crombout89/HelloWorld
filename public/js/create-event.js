document.addEventListener('DOMContentLoaded', () => {
    const createEventForm = document.getElementById('create-event-form');
    const titleInput = document.getElementById('event-title');
    const descriptionInput = document.getElementById('event-description');
    const dateInput = document.getElementById('event-date');
    const locationInput = document.getElementById('event-location');
    const imageUploadInput = document.getElementById('event-image-upload');

    // Form validation
    function validateForm() {
        let isValid = true;
        const today = new Date();

        // Title validation
        if (titleInput.value.trim().length < 5) {
            titleInput.classList.add('is-invalid');
            isValid = false;
        } else {
            titleInput.classList.remove('is-invalid');
        }

        // Description validation
        if (descriptionInput.value.trim().length < 20) {
            descriptionInput.classList.add('is-invalid');
            isValid = false;
        } else {
            descriptionInput.classList.remove('is-invalid');
        }

        // Date validation
        const selectedDate = new Date(dateInput.value);
        if (selectedDate < today) {
            dateInput.classList.add('is-invalid');
            isValid = false;
        } else {
            dateInput.classList.remove('is-invalid');
        }

        // Location validation
        if (locationInput.value.trim().length < 3) {
            locationInput.classList.add('is-invalid');
            isValid = false;
        } else {
            locationInput.classList.remove('is-invalid');
        }

        return isValid;
    }

    // Image preview
    if (imageUploadInput) {
        imageUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            const previewImage = document.getElementById('event-image-preview');
            
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    previewImage.src = event.target.result;
                    previewImage.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Form submission
    if (createEventForm) {
        createEventForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Validate form
            if (!validateForm()) {
                return;
            }

            // Get form data
            const formData = new FormData(createEventForm);
            const errorContainer = document.getElementById('error-message');

            // Disable submit button during submission
            const submitButton = createEventForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Creating Event...';

            try {
                const response = await fetch('/create-event', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || 'Event creation failed');
                }
                
                // Clear any previous error messages
                if (errorContainer) {
                    errorContainer.textContent = '';
                    errorContainer.classList.add('hidden');
                }

                // Redirect or show success message
                window.location.href = `/events/${result.eventId}`;
            } catch (error) {
                console.error('Event creation error:', error);
                
                // Show error message
                if (errorContainer) {
                    errorContainer.textContent = error.message;
                    errorContainer.classList.remove('hidden');
                }

                // Re-enable submit button
                submitButton.disabled = false;
                submitButton.textContent = 'Create Event';
            }
        });
    }

    // Character count for description
    if (descriptionInput) {
        descriptionInput.addEventListener('input', () => {
            const remainingChars = 500 - descriptionInput.value.length;
            const charCountDisplay = document.getElementById('description-char-count');
            
            if (charCountDisplay) {
                charCountDisplay.textContent = `${remainingChars} characters remaining`;
            }
        });
    }
});