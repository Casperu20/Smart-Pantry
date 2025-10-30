import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="bg-green-50 min-h-screen flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-5xl font-extrabold text-green-700 mb-4">
        Welcome to Smart Pantry
      </h1>
      <p className="text-lg text-gray-700 mb-6">
        Discover, save, and create delicious recipes!
      </p>
      <div className="space-x-4">
        <Link to="/recipes" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition">
          View Recipes
        </Link>
        <Link to="/recipe/new" className="bg-white border border-green-600 text-green-600 px-6 py-3 rounded-lg hover:bg-green-100 transition">
          Create Recipe
        </Link>
      </div>
    </div>
  );
}

export default Home;
