import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, doc, deleteDoc, query, orderBy, updateDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

function Admin() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data
  const [stats, setStats] = useState({ users: 0, recipes: 0, comments: 0 });
  const [users, setUsers] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate('/login');
        return;
      }
      
      setUser(currentUser);
      
      // Check if user is admin
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();
      
      if (userData?.isAdmin) {
        setIsAdmin(true);
        fetchAdminData();
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, [navigate]);

  const fetchAdminData = async () => {
    try {
      // Fetch all users
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);

      // Fetch all recipes
      const recipesQuery = query(collection(db, 'recipes'), orderBy('createdAt', 'desc'));
      const recipesSnap = await getDocs(recipesQuery);
      const recipesData = recipesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecipes(recipesData);

      // Calculate stats
      setStats({
        users: usersData.length,
        recipes: recipesData.length,
        comments: 0 // Add comment counting if you have comments
      });

      // Create recent activity log
      const activity = recipesData.slice(0, 10).map(recipe => ({
        type: 'recipe',
        action: 'created',
        item: recipe.name,
        user: recipe.authorName || recipe.author,
        date: recipe.createdAt?.toDate() || new Date()
      }));
      setRecentActivity(activity);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This will also delete all their recipes.`)) {
      return;
    }

    try {
      // Delete user's recipes
      const userRecipes = recipes.filter(r => r.authorId === userId);
      for (const recipe of userRecipes) {
        await deleteDoc(doc(db, 'recipes', recipe.id));
      }

      // Delete user document
      await deleteDoc(doc(db, 'users', userId));
      
      alert('User and their recipes deleted successfully');
      fetchAdminData();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleDeleteRecipe = async (recipeId, recipeName) => {
    if (!window.confirm(`Are you sure you want to delete recipe "${recipeName}"?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'recipes', recipeId));
      alert('Recipe deleted successfully');
      fetchAdminData();
    } catch (error) {
      console.error('Error deleting recipe:', error);
      alert('Failed to delete recipe');
    }
  };

  const handleToggleAdmin = async (userId, currentStatus, userName) => {
    if (!window.confirm(`${currentStatus ? 'Remove' : 'Grant'} admin privileges for "${userName}"?`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'users', userId), {
        isAdmin: !currentStatus
      });
      alert('Admin status updated');
      fetchAdminData();
    } catch (error) {
      console.error('Error updating admin status:', error);
      alert('Failed to update admin status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-xl text-gray-600 dark:text-gray-400 animate-pulse">Loading admin panel...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">You don't have permission to access this page.</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <span className="text-4xl">🛡️</span>
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back, {user?.displayName}</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Exit Admin
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Total Users</p>
                <p className="text-4xl font-bold">{stats.users}</p>
              </div>
              <div className="text-5xl opacity-50">👥</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-green-100 text-sm font-medium mb-1">Total Recipes</p>
                <p className="text-4xl font-bold">{stats.recipes}</p>
              </div>
              <div className="text-5xl opacity-50">🍳</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-purple-100 text-sm font-medium mb-1">Recent Activity</p>
                <p className="text-4xl font-bold">{recentActivity.length}</p>
              </div>
              <div className="text-5xl opacity-50">📊</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'dashboard'
                ? 'bg-green-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'users'
                ? 'bg-green-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            👥 Users
          </button>
          <button
            onClick={() => setActiveTab('recipes')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'recipes'
                ? 'bg-green-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            🍳 Recipes
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-3xl">🍳</div>
                  <div className="flex-1">
                    <p className="text-gray-900 dark:text-white font-medium">
                      <span className="font-bold">{activity.user}</span> created recipe "{activity.item}"
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {activity.date.toLocaleDateString()} at {activity.date.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Recipes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Admin</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <img 
                            src={u.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || u.email)}`}
                            alt={u.displayName}
                            className="w-10 h-10 rounded-full"
                          />
                          <span className="font-medium text-gray-900 dark:text-white">{u.displayName || 'No name'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{u.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {recipes.filter(r => r.authorId === u.id).length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {u.isAdmin ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Admin</span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">User</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleAdmin(u.id, u.isAdmin, u.displayName || u.email)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium"
                          >
                            {u.isAdmin ? 'Remove Admin' : 'Make Admin'}
                          </button>
                          {u.id !== user.uid && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.displayName || u.email)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 font-medium"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recipes Tab */}
        {activeTab === 'recipes' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Recipe</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Author</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recipes.map(recipe => (
                    <tr key={recipe.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{recipe.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{recipe.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {recipe.authorName || recipe.author?.split('@')[0]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {recipe.category || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {recipe.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/recipe/${recipe.id}`)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteRecipe(recipe.id, recipe.name)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;