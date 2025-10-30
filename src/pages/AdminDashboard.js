import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, 'users'));
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    const fetchRecipes = async () => {
      const snapshot = await getDocs(collection(db, 'recipes'));
      setRecipes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchUsers();
    fetchRecipes();
  }, []);

  const handleDeleteRecipe = async (id) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      await deleteDoc(doc(db, 'recipes', id));
      setRecipes(recipes.filter(r => r.id !== id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h2 className="text-3xl font-bold text-green-700">Admin Dashboard</h2>

      <div>
        <h3 className="text-2xl font-semibold mb-2">Users</h3>
        <ul className="space-y-2">
          {users.map(user => (
            <li key={user.id} className="border rounded-lg p-3 bg-gray-50">{user.email}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-2xl font-semibold mb-2">Recipes</h3>
        <ul className="space-y-2">
          {recipes.map(recipe => (
            <li key={recipe.id} className="border rounded-lg p-3 bg-gray-50 flex justify-between items-center">
              <span>{recipe.name}</span>
              <button
                onClick={() => handleDeleteRecipe(recipe.id)}
                className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default AdminDashboard;
