import React from 'react';

function UserProfile({ name = "User", bio = "Tell us about yourself!", interests = [] }) {
  return (
    <div className="p-4 border rounded-lg shadow-md">
      <h2 className="text-xl font-semibold">{name}</h2>
      <p className="text-gray-600">{bio}</p>
      <h3 className="text-lg mt-2">Interests:</h3>
      <ul className="list-disc list-inside">
        {interests.map((interest, index) => (
          <li key={index}>{interest}</li>
        ))}
      </ul>
    </div>
  );
}

export default UserProfile;