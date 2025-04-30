# Getting Started with the Project (2800-202510-DTC04)

This guide outlines the steps to set up and run the 2800-202510-DTC04 project after cloning the repository.  The project uses Vite for development.

## Prerequisites

* **Node.js and npm:**  You'll need Node.js and npm (which comes with Node.js).  Download and install from [https://nodejs.org/](https://nodejs.org/). Verify by running `node -v` and `npm -v`.
* **Git:** Required to clone the repository. Download and install from [https://git-scm.com/](https://git-scm.com/).

## Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/crombout89/2800-202510-DTC04.git
   ```

2. **Navigate to the Project Directory:**

   ```bash
   cd 2800-202510-DTC04
   ```

3. **Install Dependencies (REQUIRED):**

   ```bash
   npm install
   ```

## Running the Application

1. **Start the Development Server:**

   ```bash
   npm run dev
   ```

2. **Access the Application:**

   Open your web browser and go to the URL shown in your terminal (usually `http://localhost:5173`, but the terminal output will confirm).

## Available Scripts

* **`npm run dev`:** Starts the Vite development server.
* **`npm run build`:** Builds the application for production (likely creates a `dist` folder).
* **`npm run preview`:**  Serves the production build locally (use after `npm run build`).

## Project Structure

* **`node_modules/`:** Contains the project's dependencies (managed by npm).
* **`src/`:** The main source code directory.
    * **`components/`:**  React components.
        * `authentication/`: Components related to user authentication (login, signup, etc.).
        * `common/`: Shared or reusable components.
        * `connections/`: Components for managing user connections or networking.
        * `groups/`: Components for group functionality.
        * `messaging/`: Components for messaging or chat features.
        * `profile/`: Components for user profiles.
        * `search/`: Components related to searching.
        * `services/`: Likely contains API calls or utility functions.
    * `App.jsx`: The root component of your React application.
    * `index.jsx`: The entry point for your React application.
* **`.gitignore`:**  Specifies files and folders to exclude from Git.
* **`GETTING_STARTED.md`:** This file.
* **`index.html`:** The main HTML file.
* **`package.json`:**  Manages project dependencies and scripts.
* **`package-lock.json`:** Locks dependency versions for consistency.
* **`README.md`:** The main project README file.
* **`vite.config.js`:** Vite's configuration file.


## Troubleshooting

* **`command not found` errors:** Double-check that you've run `npm install`.
* **Port conflicts:** Vite will guide you if another application is using the same port.
* **Other issues:** Refer to the project's `README.md` or contact the project maintainers.
