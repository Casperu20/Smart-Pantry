import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Link } from 'react-router-dom';

function RecipeList() {
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    const fetchRecipes = async () => {
      const q = query(collection(db, 'recipes'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setRecipes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchRecipes();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6 text-green-700">All Recipes</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map(recipe => (
          <Link key={recipe.id} to={`/recipe/${recipe.id}`} className="bg-white shadow-md rounded-lg p-4 hover:shadow-xl transition">
            <h3 className="text-xl font-semibold mb-2">{recipe.name}</h3>
            <p className="text-gray-600 text-sm">{recipe.description}</p>
          </Link>
        ))}
        {recipes.length === 0 && <p>No recipes found.</p>}
      </div>
    </div>
  );
}

export default RecipeList;
