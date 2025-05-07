import React from 'react';
import styles from '../styles/Home.module.css'; // Import Home-specific styles
import '../styles/global.css'; // Import global styles

function Home() {
  return (
    <div className={styles.container}> {/* Use styles.container */}
      <h1 className={styles.title}>Welcome to HelloWorld!</h1> {/* Use styles.title */}
      <p className={styles.description}> {/* Use styles.description */}
        Connect with people across the globe based on shared interests. ...
      </p>
      <div className={styles.buttons}> {/* Use styles.buttons */}
        <a href="/profile" className={`${styles.button} ${styles.profileButton}`}> {/* Combine styles */}
          Create Your Profile
        </a>
        <a href="/create-event" className={`${styles.button} ${styles.eventButton}`}> {/* Combine styles */}
          Create an Event
        </a>
      </div>
    </div>
  );
}

export default Home;