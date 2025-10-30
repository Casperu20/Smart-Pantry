import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import RecipeForm from './RecipeForm';

function RecipeDetail() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [showRemix, setShowRemix] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const fetchRecipe = async () => {
      const docRef = doc(db, 'recipes', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setRecipe({ id: docSnap.id, ...docSnap.data() });
      else alert('Recipe not found');
    };

    const fetchComments = async () => {
      const q = query(collection(db, 'recipes', id, 'comments'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetchRecipe();
    fetchComments();
  }, [id]);

  const handleCommentSubmit = async () => {
    if (!auth.currentUser || !newComment) return;
    await addDoc(collection(db, 'recipes', id, 'comments'), {
      text: newComment,
      author: auth.currentUser.email,
      createdAt: new Date(),
    });
    setNewComment('');
    // Refresh comments
    const q = query(collection(db, 'recipes', id, 'comments'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  if (!recipe) return <p className="text-center mt-6">Loading...</p>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-4xl font-bold text-green-700">{recipe.name}</h1>
      <p className="text-gray-700">{recipe.description}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Ingredients</h2>
          <ul className="list-disc list-inside text-gray-600">
            {recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
          </ul>
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-2">Instructions</h2>
          <p className="text-gray-600">{recipe.instructions}</p>
        </div>
      </div>

      {auth.currentUser && (
        <button
          onClick={() => setShowRemix(!showRemix)}
          className="mt-4 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
        >
          {showRemix ? 'Cancel Remix' : 'Remix Recipe'}
        </button>
      )}

      {showRemix && <RecipeForm defaultRecipe={recipe} onSave={() => setShowRemix(false)} />}

      {/* Comments Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Comments</h2>
        {auth.currentUser && (
          <div className="flex flex-col space-y-2 mb-4">
            <textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
            <button
              onClick={handleCommentSubmit}
              className="self-end bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Post
            </button>
          </div>
        )}
        {comments.length > 0 ? (
          <ul className="space-y-2">
            {comments.map(comment => (
              <li key={comment.id} className="border rounded-lg p-3 bg-gray-50">
                <p className="text-gray-800">{comment.text}</p>
                <span className="text-gray-500 text-sm">by {comment.author}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No comments yet.</p>
        )}
      </div>
    </div>
  );
}

export default RecipeDetail;
