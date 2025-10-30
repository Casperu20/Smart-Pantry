import React from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../firebase/config';

function Navbar() {
  const user = auth.currentUser;

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        <Link to="/" className="text-2xl font-bold text-green-600 hover:text-green-800">
          Smart Pantry
        </Link>
        <div className="space-x-4 flex items-center">
          <Link to="/" className="text-gray-700 hover:text-green-600">Home</Link>
          <Link to="/recipes" className="text-gray-700 hover:text-green-600">All Recipes</Link>
          {user && <Link to="/recipe/new" className="text-gray-700 hover:text-green-600">Create Recipe</Link>}
          <Link to="/search" className="text-gray-700 hover:text-green-600">Search</Link>
          {user ? (
            <>
              <Link to="/profile" className="text-gray-700 hover:text-green-600">Profile</Link>
              <span className="text-gray-500 ml-2 text-sm">Hi, {user.email}</span>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-700 hover:text-green-600">Login</Link>
              <Link to="/register" className="text-gray-700 hover:text-green-600">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
