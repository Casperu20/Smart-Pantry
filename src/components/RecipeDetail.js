import React, { useEffect, useState } from 'react';
<<<<<<< HEAD
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  doc, getDoc, collection, addDoc, getDocs,
  query, where, orderBy, updateDoc, arrayUnion
=======
import { useParams, useNavigate } from 'react-router-dom';
import { 
  doc, getDoc, collection, addDoc, getDocs, 
  query, where, orderBy, updateDoc, arrayUnion, arrayRemove //
>>>>>>> origin/main
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import RecipeForm from './RecipeForm';
import RecipeImage from './RecipeImage';

function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [showRemix, setShowRemix] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [user, setUser] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [remixes, setRemixes] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Theme (dark mode) support
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    return localStorage.getItem('theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  useEffect(() => {
    // Apply theme class to <html>
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const fetchRecipe = React.useCallback(async () => {
    try {
      const docRef = doc(db, 'recipes', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const recipeData = { id: docSnap.id, ...docSnap.data() };
        setRecipe(recipeData);
        calculateAverageRating(recipeData.ratings || []);

        if (user && recipeData.favoritedBy) {
          setIsFavorite(recipeData.favoritedBy.includes(user.uid));
        }
      } else {
        alert('Recipe not found');
        navigate('/recipes');
      }
    } catch (error) {
      console.error('Error fetching recipe:', error);
    }
  }, [id, user, navigate]);

  const fetchComments = React.useCallback(async () => {
    try {
      const q = query(
        collection(db, 'recipes', id, 'comments'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }, [id]);

  const fetchRemixes = React.useCallback(async () => {
    try {
      const q = query(
        collection(db, 'recipes'),
        where('originalRecipeId', '==', id)
      );
      const snapshot = await getDocs(q);
      const recipeRemixes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRemixes(recipeRemixes);
    } catch (error) {
      console.error('Error fetching remixes:', error);
    }
  }, [id]);

  useEffect(() => {
    fetchRecipe();
    fetchComments();
    fetchRemixes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, fetchRecipe, fetchComments, fetchRemixes]);

  const calculateAverageRating = (ratings) => {
    if (!ratings || ratings.length === 0) {
      setAverageRating(0);
      return;
    }
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    setAverageRating((sum / ratings.length).toFixed(1));
  };

  const handleRating = async (rating) => {
    if (!user) {
      alert('Please login to rate recipes');
      return;
    }

    try {
      const docRef = doc(db, 'recipes', id);
      const updatedRatings = [
        ...(recipe.ratings || []).filter(r => r.userId !== user.uid),
        { userId: user.uid, rating }
      ];

      await updateDoc(docRef, { ratings: updatedRatings });
      setUserRating(rating);
      calculateAverageRating(updatedRatings);
    } catch (error) {
      console.error('Error rating recipe:', error);
    }
  };

  const handleCommentSubmit = async () => {
    if (!user) {
      alert('Please login to comment');
      return;
    }
    if (!newComment.trim()) return;

    try {
      await addDoc(collection(db, 'recipes', id, 'comments'), {
        text: newComment,
        author: user.email,
        authorName: user.displayName || user.email.split('@')[0],
        createdAt: new Date(),
      });
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const handleFavorite = async () => {
  if (!user) {
    alert('Please login to favorite recipes');
    return;
  }

<<<<<<< HEAD
    try {
      const docRef = doc(db, 'recipes', id);
      if (isFavorite) {
        const updatedFavorites = recipe.favoritedBy.filter(uid => uid !== user.uid);
        await updateDoc(docRef, { favoritedBy: updatedFavorites });
        setIsFavorite(false);
      } else {
        await updateDoc(docRef, {
          favoritedBy: arrayUnion(user.uid)
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
=======
  // 1. Create a copy of the current list to avoid mutating state directly
  const previousFavorites = recipe.favoritedBy || [];
  let newFavorites;
  let newIsFavoriteStatus;

  if (isFavorite) {
    // Remove logic
    newFavorites = previousFavorites.filter(uid => uid !== user.uid);
    newIsFavoriteStatus = false;
  } else {
    // Add logic
    newFavorites = [...previousFavorites, user.uid];
    newIsFavoriteStatus = true;
  }

  // 2. OPTIMISTIC UPDATE: Update UI immediately
  setIsFavorite(newIsFavoriteStatus);
  setRecipe({ ...recipe, favoritedBy: newFavorites });

  // 3. Update Database in background
  try {
    const docRef = doc(db, 'recipes', id);
    
    if (newIsFavoriteStatus) {
      await updateDoc(docRef, { favoritedBy: arrayUnion(user.uid) });
    } else {
      await updateDoc(docRef, { favoritedBy: arrayRemove(user.uid) });
>>>>>>> origin/main
    }
  } catch (error) {
    console.error('Error updating favorites:', error);
    // 4. REVERT UI if database fails
    setIsFavorite(!newIsFavoriteStatus);
    setRecipe({ ...recipe, favoritedBy: previousFavorites });
    alert("Failed to save favorite. Check your console for permission errors.");
  }
};


  const renderIngredient = (ing) => {
    if (typeof ing === 'string') {
      return ing;
    }
    return `${ing.quantity ? ing.quantity + ' ' : ''}${ing.unit ? ing.unit + ' ' : ''}${ing.name}`.trim();
  };

  const images = recipe?.images || (recipe?.imageUrl ? [recipe.imageUrl] : []);
  const hasMultipleImages = images.length > 1;

  if (!recipe) return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-xl text-gray-600 dark:text-gray-300">Loading...</div>
    </div>
  );

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-6 lg:py-10 space-y-6">
        {/* Topbar with theme toggle & back link */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:shadow-md transition"
              aria-label="Go back"
            >
              ← Back
            </button>
            <Link to="/recipes" className="text-sm text-gray-600 dark:text-gray-300 hover:underline">All Recipes</Link>
          </div>

          <div className="flex items-center gap-3">
            

            {user && (
              <button
                onClick={() => navigate(`/profile/${user.uid}`)}
                className="px-3 py-2 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 hover:shadow-md transition text-sm"
              >
                {user.displayName || user.email?.split('@')[0]}
              </button>
            )}
          </div>
        </div>

        {/* Image Gallery */}
        <div className="relative rounded-xl overflow-hidden shadow-lg bg-gray-100 dark:bg-gray-800">
          {images.length > 0 ? (
            <>
              <img
                src={images[currentImageIndex]}
                alt={recipe.name}
                className="w-full h-60 sm:h-80 md:h-96 object-cover"
                loading="lazy"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
                }}
              />
              <div className="hidden w-full h-60 sm:h-80 md:h-96 bg-gradient-to-br from-green-400 to-green-600 items-center justify-center">
                <span className="text-7xl">🍽️</span>
              </div>

              {hasMultipleImages && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-60 transition"
                    aria-label="Previous image"
                  >
                    ❮
                  </button>

                  <button
                    onClick={() => setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-60 transition"
                    aria-label="Next image"
                  >
                    ❯
                  </button>

                  <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-3 h-3 rounded-full transition ${index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-40'}`}
                        aria-label={`Show image ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}

              {recipe.isRemix && (
                <span className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full font-semibold shadow-lg text-sm">
                  Remix
                </span>
              )}
            </>
          ) : (
            <RecipeImage recipe={recipe} className="w-full h-60 sm:h-80 md:h-96" showBadge={true} />
          )}
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-green-700 dark:text-green-400 leading-tight">{recipe.name}</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-2">
              By {recipe.authorName || recipe.author?.split('@')[0] || 'Anonymous'} • {recipe.createdAt?.toDate?.().toLocaleDateString?.() ?? ''}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <button
                onClick={handleFavorite}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm ${
                  isFavorite
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:shadow-md'
                }`}
                aria-pressed={isFavorite}
              >
                {isFavorite ? '❤️ Favorited' : '🤍 Add to Favorites'}
              </button>
            )}

            <div className="text-right">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRating(star)}
                    className={`text-2xl sm:text-3xl px-1 focus:outline-none ${
                      star <= (userRating || 0) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                    }`}
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    title={`Rate ${star}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {averageRating > 0 ? `${averageRating} / 5` : 'No ratings yet'}
                {recipe.ratings && ` (${recipe.ratings.length} ${recipe.ratings.length === 1 ? 'rating' : 'ratings'})`}
              </div>
            </div>
          </div>
        </div>

        {/* Short description */}
        <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300">{recipe.description}</p>

        {/* Main content: Ingredients + Instructions (responsive) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ingredients */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-green-600 dark:text-green-400">Ingredients</h2>
            <ul className="space-y-2">
              {recipe.ingredients?.map((ing, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-1 text-green-500">•</span>
                  <span className="text-gray-700 dark:text-gray-200 break-words">{renderIngredient(ing)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-green-600 dark:text-green-400">Instructions</h2>
            <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-200 whitespace-pre-line">
              {recipe.instructions}
            </div>
          </div>
        </div>

        {/* Remix CTA */}
        {user && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRemix(!showRemix)}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-semibold shadow"
            >
              {showRemix ? 'Cancel Remix' : '🎨 Remix This Recipe'}
            </button>

            <button
              onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow transition"
            >
              💬 Jump to Comments
            </button>
          </div>
        )}

        {/* Remix form */}
        {showRemix && (
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Create Your Remix</h3>
            <RecipeForm
              defaultRecipe={recipe}
              isRemix={true}
              originalRecipeId={id}
              onSave={() => {
                setShowRemix(false);
                fetchRemixes();
=======
    <div className="bg-gray-900 min-h-screen">
    <div className="max-w-5xl mx-auto p-6 space-y-6
     bg-white dark:bg-gray-900 
     text-gray-900 dark:text-gray-100 
     rounded-xl">
      {/* Image Gallery */}
      <div className="relative rounded-xl overflow-hidden shadow-lg">
        {images.length > 0 ? (
          <>
            <img 
              src={images[currentImageIndex]} 
              alt={recipe.name}
              className="w-full h-96 object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
>>>>>>> origin/main
              }}
            />
          </div>
        )}

        {/* Community remixes */}
        {remixes.length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-green-600 dark:text-green-400">
              Community Remixes ({remixes.length})
            </h2>

            <div className="overflow-x-auto -mx-2 px-2">
              <div className="flex gap-4 pb-2">
                {remixes.map((remix) => (
                  <Link
                    key={remix.id}
                    to={`/recipe/${remix.id}`}
                    className="flex-shrink-0 w-64 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden hover:shadow-lg transition border border-gray-100 dark:border-gray-700"
                  >
                    <RecipeImage recipe={remix} className="w-full h-36" />
                    <div className="p-3">
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
                        {remix.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                        {remix.description}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        by {remix.authorName || remix.author?.split('@')[0] || 'Anonymous'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Comments */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-green-600 dark:text-green-400">Comments ({comments.length})</h2>

<<<<<<< HEAD
          {user ? (
            <div className="mb-6">
              <textarea
                placeholder="Share your thoughts about this recipe..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[6rem] placeholder-gray-500"
                aria-label="New comment"
              />
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={handleCommentSubmit}
                  disabled={!newComment.trim()}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed"
=======
      {/* Rating */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleRating(star)}
              className={`text-3xl ${
                star <= (userRating || 0) ? 'text-yellow-500' : 'text-gray-300'
              } hover:text-yellow-400 transition`}
            >
              ★
            </button>
          ))}
        </div>
        <span className="text-lg text-gray-600 dark:text-gray-300">
          {averageRating > 0 ? `${averageRating} / 5` : 'No ratings yet'}
          {recipe.ratings && ` (${recipe.ratings.length} ${recipe.ratings.length === 1 ? 'rating' : 'ratings'})`}
        </span>
      </div>

      <p className="text-gray-700 dark:text-gray-300 text-lg">{recipe.description}</p>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ingredients - Dark Theme Enforced */}
        <div className="bg-gray-900 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-green-500">Ingredients</h2>
          <ul className="space-y-2">
            {recipe.ingredients?.map((ing, i) => (
              <li key={i} className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span className="text-gray-300">{renderIngredient(ing)}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Instructions - Dark Theme Enforced */}
        <div className="bg-gray-900 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-green-500">Instructions</h2>
          <p className="text-gray-300 whitespace-pre-line">{recipe.instructions}</p>
        </div>
      </div>

      {/* Remix Button */}
      {user && (
        <button
          onClick={() => setShowRemix(!showRemix)}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold"
        >
          {showRemix ? 'Cancel Remix' : '🎨 Remix This Recipe'}
        </button>
      )}

      {showRemix && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Create Your Remix</h3>
          <RecipeForm 
            defaultRecipe={recipe} 
            isRemix={true}
            originalRecipeId={id}
            onSave={() => {
              setShowRemix(false);
              fetchRemixes();
            }} 
          />
        </div>
      )}

      {/* Remixes Section - Dark Theme Enforced */}
      {remixes.length > 0 && (
        <div className="bg-gray-900 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-green-500">
            Community Remixes ({remixes.length})
          </h2>
          <div className="overflow-x-auto">
            <div className="flex gap-4 pb-4">
              {remixes.map((remix) => (
                <Link
                  key={remix.id}
                  to={`/recipe/${remix.id}`}
                  className="flex-shrink-0 w-64 bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition border border-gray-700"
>>>>>>> origin/main
                >
                  Post Comment
                </button>

                <button
                  onClick={() => setNewComment('')}
                  className="px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:shadow transition"
                >
                  Clear
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-300 mb-4">Please login to comment</p>
          )}

          {comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="border-l-4 border-green-500 pl-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-md">
                  <p className="text-gray-800 dark:text-gray-100">{comment.text}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">
                      {comment.authorName || comment.author}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      {comment.createdAt?.toDate?.().toLocaleString?.() ?? ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-6">No comments yet. Be the first to share your thoughts!</p>
          )}
        </div>
      </div>
    </div>
    </div>
    
  );
}

export default RecipeDetail;
