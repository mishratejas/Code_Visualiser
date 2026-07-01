import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiCheck, FiKey, FiBriefcase } from 'react-icons/fi';
import { MdOutlineEmojiEvents } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const OrganizerRegister = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', organizationName: '', inviteCode: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.username || formData.username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Valid email required';
    if (!formData.password || formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!formData.inviteCode) newErrors.inviteCode = 'Invite code is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await api.post('/auth/register/organizer', formData);
      const { user, token } = response.data?.data || response.data || response;
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }
      toast.success('Organizer account created! You can now create contests. 🎉');
      navigate('/dashboard');
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed';
      if (msg.includes('invite') || msg.includes('code')) {
        setErrors({ ...errors, inviteCode: 'Invalid invite code' });
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const bg = isDark ? 'bg-gray-950' : 'bg-gray-50';
  const card = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-lg';
  const text = isDark ? 'text-white' : 'text-gray-900';
  const sub = isDark ? 'text-gray-400' : 'text-gray-600';
  const input = isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';
  const label = `block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;

  const InputField = ({ name, type = 'text', placeholder, labelText, icon: Icon, rightElement }) => (
    <div>
      <label className={label}>{labelText}</label>
      <div className="relative">
        <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${sub}`} />
        <input
          type={type}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-3 ${input} rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${errors[name] ? 'border-red-500' : ''}`}
        />
        {rightElement && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>}
      </div>
      {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className={`min-h-screen ${bg} flex items-center justify-center py-8 px-4`}>
      <div className={`${card} border rounded-2xl w-full max-w-md p-8`}>
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-rose-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
            <MdOutlineEmojiEvents className="h-8 w-8 text-white" />
          </div>
          <h1 className={`text-2xl font-bold ${text}`}>Become an Organizer</h1>
          <p className={`text-sm ${sub} mt-2`}>Create and host coding contests for your community</p>
        </div>

        {/* Benefits */}
        <div className={`${isDark ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50 border-rose-200'} border rounded-xl p-4 mb-6 space-y-2`}>
          {['Create unlimited contests', 'Set problems and prizes', 'View participant analytics', 'Manage your own community'].map(benefit => (
            <div key={benefit} className="flex items-center gap-2 text-sm">
              <FiCheck className="h-4 w-4 text-rose-500 flex-shrink-0" />
              <span className={sub}>{benefit}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField name="username" labelText="Username" placeholder="Your username" icon={FiUser} />
          <InputField name="email" type="email" labelText="Email" placeholder="your@email.com" icon={FiMail} />
          <InputField
            name="password"
            type={showPassword ? 'text' : 'password'}
            labelText="Password"
            placeholder="At least 6 characters"
            icon={FiLock}
            rightElement={
              <button type="button" onClick={() => setShowPassword(!showPassword)} className={sub}>
                {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
              </button>
            }
          />
          <InputField name="organizationName" labelText="Organization Name (optional)" placeholder="e.g. Tech Club, IIT Coding Society" icon={FiBriefcase} />
          
          <div>
            <label className={label}>Invite Code <span className="text-rose-500">*</span></label>
            <div className="relative">
              <FiKey className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${sub}`} />
              <input
                type="text"
                name="inviteCode"
                value={formData.inviteCode}
                onChange={handleChange}
                placeholder="Enter your invite code"
                className={`w-full pl-10 pr-4 py-3 ${input} rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${errors.inviteCode ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.inviteCode && <p className="text-xs text-red-500 mt-1">{errors.inviteCode}</p>}
            <p className={`text-xs ${sub} mt-1`}>Contact your platform admin to get an invite code.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Creating Account...</>
            ) : (
              <><FiCheck className="h-4 w-4" />Create Organizer Account</>
            )}
          </button>
        </form>

        <div className="mt-5 space-y-2 text-center">
          <p className={`text-sm ${sub}`}>
            Regular user?{' '}
            <Link to="/register" className="text-rose-500 hover:underline font-medium">Sign up here</Link>
          </p>
          <p className={`text-sm ${sub}`}>
            Already have an account?{' '}
            <Link to="/login" className="text-rose-500 hover:underline font-medium">Log in</Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default OrganizerRegister;
