document.addEventListener('DOMContentLoaded', () => {
    const createEventForm = document.getElementById('create-event-form');
    const titleInput = document.getElementById('event-title');
    const descriptionInput = document.getElementById('event-description');
    const dateInput = document.getElementById('event-date');
    const timeInput = document.getElementById('event-time');
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
        if (!document.getElementById('location-lat').value || 
            !document.getElementById('location-lng').value) {
            document.getElementById('event-location').classList.add('is-invalid');
            isValid = false;
        } else {
            document.getElementById('event-location').classList.remove('is-invalid');
        }

        return isValid;
    }

    // Image preview
    if (imageUploadInput) {
        imageUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            const preview = document.getElementById('event-image-preview');
            
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.src = e.target.result;
                    preview.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            } else {
                preview.src = '';
                preview.classList.add('hidden');
            }
        });
    }

    // Form submission
    if (createEventForm) {
        createEventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (validateForm()) {
                try {
                    createEventForm.submit();
                } catch (error) {
                    console.error('Error submitting form:', error);
                    document.getElementById('error-message').textContent = 'An error occurred. Please try again.';
                    document.getElementById('error-message').classList.remove('hidden');
                }
            } else {
                document.getElementById('error-message').textContent = 'Please correct the errors in the form.';
                document.getElementById('error-message').classList.remove('hidden');
            }
        });
    }

    // Character count for description
    if (descriptionInput) {
        descriptionInput.addEventListener('input', () => {
            const remaining = 500 - descriptionInput.value.length;
            document.getElementById('description-char-count').textContent = 
                `${remaining} characters remaining`;
        });
    }
});