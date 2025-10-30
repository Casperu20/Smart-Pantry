import React, { useState, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';

function RecipeForm({ onSave, defaultRecipe }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    if (defaultRecipe) {
      setName(defaultRecipe.name + ' (Remix)');
      setDescription(defaultRecipe.description);
      setIngredients(defaultRecipe.ingredients.join(', '));
      setInstructions(defaultRecipe.instructions);
    }
  }, [defaultRecipe]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return alert('You must be logged in.');

    try {
      await addDoc(collection(db, 'recipes'), {
        name,
        description,
        ingredients: ingredients.split(',').map(i => i.trim()),
        instructions,
        author: auth.currentUser.email,
        createdAt: new Date()
      });
      setName('');
      setDescription('');
      setIngredients('');
      setInstructions('');
      if (onSave) onSave();
      alert('Recipe saved!');
    } catch (err) {
      console.error(err);
      alert('Failed to save recipe.');
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mt-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-green-700">
        {defaultRecipe ? 'Remix Recipe' : 'Create Recipe'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Recipe Name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
        />
        <textarea
          placeholder="Ingredients (comma separated)"
          value={ingredients}
          onChange={e => setIngredients(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
        />
        <textarea
          placeholder="Instructions"
          value={instructions}
          onChange={e => setInstructions(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition w-full"
        >
          {defaultRecipe ? 'Save Remix' : 'Create Recipe'}
        </button>
      </form>
    </div>
  );
}

export default RecipeForm;
