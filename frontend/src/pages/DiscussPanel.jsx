import React, { useState, useEffect, useCallback } from 'react';
import { FiMessageSquare, FiSend, FiChevronUp, FiRefreshCw, FiCornerDownRight } from 'react-icons/fi';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const safeDate = (v) => {
  try { return format(new Date(v), 'MMM dd, HH:mm'); } catch { return ''; }
};

export default function DiscussPanel({ problemId, problemTitle, isDark }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostBody, setNewPostBody] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [expandedPost, setExpandedPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);

  const txt  = isDark ? 'text-white' : 'text-gray-900';
  const sub  = isDark ? 'text-gray-400' : 'text-gray-500';
  const card = isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200';
  const inp  = isDark ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/discuss', { params: { problemId, limit: 20, sort: 'top' } });
      // api interceptor already unwraps: res = { success, data: { threads, ... } }
      const threads = res?.data?.threads || res?.threads || [];
      setPosts(threads);
    } catch (e) {
      console.error('DiscussPanel load error:', e);
    } finally {
      setLoading(false);
    }
  }, [problemId]);

  useEffect(() => { load(); }, [load]);

  const handlePost = async () => {
    if (!newPostTitle.trim()) { toast.error('Add a title'); return; }
    if (!newPostBody.trim())  { toast.error('Write something'); return; }
    setPosting(true);
    try {
      await api.post('/discuss', {
        title: newPostTitle.trim(),
        content: newPostBody.trim(),
        problemId,
        tags: ['question'],
      });
      toast.success('Posted!');
      setNewPostTitle('');
      setNewPostBody('');
      setShowCompose(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to post');
    } finally {
      setPosting(false);
    }
  };

  const handleVote = async (postId) => {
    if (!user) { toast.error('Login to vote'); return; }
    try {
      const r = await api.post(`/discuss/${postId}/vote`);
      const newVotes = r?.data?.votes ?? r?.votes;
      if (newVotes !== undefined) {
        setPosts(ps => ps.map(p => p.id === postId || p._id === postId ? { ...p, votes: newVotes } : p));
      }
    } catch { toast.error('Failed to vote'); }
  };

  const loadPostComments = async (post) => {
    if (expandedPost?.id === post.id) { setExpandedPost(null); return; }
    try {
      const r = await api.get(`/discuss/${post.id}`);
      const d = r?.data;
      setExpandedPost({ ...post, comments: d?.comments || [] });
    } catch {
      setExpandedPost({ ...post, comments: [] });
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !expandedPost) return;
    setCommenting(true);
    try {
      await api.post(`/discuss/${expandedPost.id}/comments`, { content: commentText.trim() });
      toast.success('Comment added');
      setCommentText('');
      loadPostComments(expandedPost);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to comment');
    } finally {
      setCommenting(false);
    }
  };

  return (
    <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        <span className={`font-bold text-sm flex items-center gap-2 ${txt}`}>
          <FiMessageSquare className="h-4 w-4 text-rose-400" />
          Discuss — {problemTitle}
        </span>
        <div className="flex gap-2">
          <button onClick={load} className="text-xs text-gray-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all">
            <FiRefreshCw className="h-3.5 w-3.5" />
          </button>
          {user && (
            <button onClick={() => setShowCompose(p => !p)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                showCompose
                  ? 'bg-rose-500 text-white'
                  : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
              }`}>
              + New Post
            </button>
          )}
        </div>
      </div>

      {/* Compose form */}
      {showCompose && user && (
        <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-gray-50'}`}>
          <input
            value={newPostTitle}
            onChange={e => setNewPostTitle(e.target.value)}
            placeholder="Post title..."
            className={`w-full mb-2 px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 ${inp}`}
          />
          <textarea
            value={newPostBody}
            onChange={e => setNewPostBody(e.target.value)}
            placeholder="Share your approach, ask a question, or discuss the problem..."
            rows={3}
            className={`w-full mb-2 px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none focus:ring-1 focus:ring-rose-500 ${inp}`}
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCompose(false)} className={`text-xs px-3 py-1.5 rounded-lg ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
              Cancel
            </button>
            <button onClick={handlePost} disabled={posting}
              className="text-xs px-4 py-1.5 bg-rose-500 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center gap-1.5">
              {posting ? <FiRefreshCw className="animate-spin h-3 w-3" /> : <FiSend className="h-3 w-3" />}
              Post
            </button>
          </div>
        </div>
      )}

      {/* Posts list */}
      <div className={`overflow-y-auto max-h-[500px] ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
        {loading ? (
          <div className="py-10 flex justify-center">
            <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="py-10 text-center">
            <FiMessageSquare className={`h-7 w-7 mx-auto mb-2 ${sub} opacity-30`} />
            <p className={`text-sm ${sub}`}>No posts yet for this problem.</p>
            {user && (
              <button onClick={() => setShowCompose(true)}
                className="mt-3 text-xs text-rose-400 hover:text-rose-300">
                Be the first to post
              </button>
            )}
          </div>
        ) : (
          <div className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-100'}`}>
            {posts.map(post => (
              <div key={post.id || post._id}>
                {/* Post row */}
                <div
                  className={`flex gap-3 px-4 py-3 cursor-pointer ${isDark ? 'hover:bg-gray-900' : 'hover:bg-gray-50'} transition-colors`}
                  onClick={() => loadPostComments(post)}
                >
                  {/* Vote */}
                  <div className="flex flex-col items-center gap-0.5 pt-0.5 shrink-0" onClick={e => { e.stopPropagation(); handleVote(post.id || post._id); }}>
                    <button className="p-1 rounded hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                      <FiChevronUp className={`h-4 w-4 ${sub}`} />
                    </button>
                    <span className={`text-xs font-bold ${txt}`}>{post.votes || 0}</span>
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${txt} line-clamp-1`}>{post.title}</p>
                    <p className={`text-xs ${sub} mt-0.5 line-clamp-1`}>{post.content || post.body}</p>
                    <div className={`flex items-center gap-3 mt-1.5 text-xs ${sub}`}>
                      <span>@{post.authorName || post.author?.username || 'user'}</span>
                      <span>{safeDate(post.createdAt)}</span>
                      <span className="flex items-center gap-1">
                        <FiMessageSquare className="h-3 w-3" />
                        {post.commentCount || (post.comments?.length ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded comments */}
                {expandedPost && (expandedPost.id === post.id || expandedPost._id === post._id) && (
                  <div className={`mx-4 mb-3 rounded-xl border overflow-hidden ${card}`}>
                    <div className={`px-3 py-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <p className={`text-xs font-semibold ${txt}`}>{expandedPost.title}</p>
                      <p className={`text-xs ${sub} mt-1 leading-relaxed`}>{expandedPost.content || expandedPost.body}</p>
                    </div>
                    {/* Comments */}
                    {expandedPost.comments?.length > 0 && (
                      <div className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-100'}`}>
                        {expandedPost.comments.map((c, i) => (
                          <div key={c._id || i} className="px-3 py-2">
                            <div className={`flex items-baseline gap-2 mb-0.5`}>
                              <span className="text-xs font-semibold text-rose-400">@{c.authorName || c.author?.username}</span>
                              <span className={`text-xs ${sub}`}>{safeDate(c.createdAt)}</span>
                            </div>
                            <p className={`text-xs ${sub} leading-relaxed`}>{c.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Add comment */}
                    {user && (
                      <div className={`flex gap-2 p-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <FiCornerDownRight className={`h-3.5 w-3.5 ${sub} mt-2 shrink-0`} />
                        <input
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
                          placeholder="Add a comment..."
                          className={`flex-1 px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 ${inp}`}
                        />
                        <button onClick={handleComment} disabled={commenting || !commentText.trim()}
                          className="p-1.5 bg-rose-500 text-white rounded-lg disabled:opacity-50 hover:bg-rose-600 transition-colors">
                          {commenting ? <FiRefreshCw className="animate-spin h-3 w-3" /> : <FiSend className="h-3 w-3" />}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Login prompt */}
      {!user && (
        <div className={`px-4 py-2.5 border-t text-xs ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'} ${sub} text-center`}>
          <a href="/login" className="text-rose-400 hover:text-rose-300 font-semibold">Login</a> to post or vote
        </div>
      )}
    </div>
  );
}