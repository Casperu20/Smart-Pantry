import React, { useEffect, useState } from 'react';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { auth } from '../firebase/config';

const CommentSection = ({ recipeId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const fetchComments = async () => {
      const q = query(collection(db, 'comments'), where('recipeId', '==', recipeId));
      const querySnapshot = await getDocs(q);
      setComments(querySnapshot.docs.map(doc => doc.data()));
    };
    fetchComments();
  }, [recipeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return alert("Login to comment");
    await addDoc(collection(db, 'comments'), {
      recipeId,
      user: auth.currentUser.email,
      content: newComment,
      date: new Date()
    });
    setNewComment('');
  };

  return (
    <div className="comment-section">
      <h3>Comments</h3>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          value={newComment} 
          onChange={(e) => setNewComment(e.target.value)} 
          placeholder="Write a comment" 
        />
        <button type="submit">Add Comment</button>
      </form>
      <ul>
        {comments.map((c, i) => <li key={i}><strong>{c.user}:</strong> {c.content}</li>)}
      </ul>
    </div>
  );
};

export default CommentSection;
