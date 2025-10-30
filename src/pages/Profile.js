import React from 'react';
import { auth } from '../firebase/config';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  if (!user) return <p className="text-center mt-6">Please login to view your profile.</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-green-700 mb-4">Profile</h2>
      <p className="text-gray-700 mb-2"><strong>Email:</strong> {user.email}</p>
      <p className="text-gray-700 mb-4"><strong>UID:</strong> {user.uid}</p>
      <button
        onClick={handleLogout}
        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
      >
        Logout
      </button>
    </div>
  );
}

export default Profile;
