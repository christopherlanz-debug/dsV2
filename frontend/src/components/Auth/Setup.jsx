import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function Setup() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (formData.password.length > 72) {
      toast.error('Password cannot be longer than 72 characters');
      return;
    }

    setLoading(true);

    try {
      // Wichtig: confirmPassword NICHT mitsenden!
      await authAPI.setup({
        username: formData.username,
        email: formData.email,
        full_name: formData.full_name || undefined, // Optional field
        password: formData.password
      });
      
      toast.success('Admin account created! Please login.');
      navigate('/login');
    } catch (error) {
      const detail = error.response?.data?.detail;
      if (Array.isArray(detail)) {
        // Pydantic validation errors
        detail.forEach(err => {
          toast.error(`${err.loc.join('.')}: ${err.msg}`);
        });
      } else {
        toast.error(detail || 'Setup failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Initial Setup</h1>
          <p className="text-gray-600 mt-2">Create your admin account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Username *</label>
            <input
              type="text"
              name="username"
              className="input"
              value={formData.username}
              onChange={handleChange}
              minLength={3}
              maxLength={50}
              required
            />
            <p className="text-xs text-gray-500 mt-1">3-50 characters</p>
          </div>

          <div>
            <label className="label">Email *</label>
            <input
              type="email"
              name="email"
              className="input"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="label">Full Name</label>
            <input
              type="text"
              name="full_name"
              className="input"
              value={formData.full_name}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="label">Password *</label>
            <input
              type="password"
              name="password"
              className="input"
              value={formData.password}
              onChange={handleChange}
              minLength={6}
              maxLength={72}
              required
            />
            <p className="text-xs text-gray-500 mt-1">6-72 characters</p>
          </div>

          <div>
            <label className="label">Confirm Password *</label>
            <input
              type="password"
              name="confirmPassword"
              className="input"
              value={formData.confirmPassword}
              onChange={handleChange}
              minLength={6}
              maxLength={72}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Admin Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
