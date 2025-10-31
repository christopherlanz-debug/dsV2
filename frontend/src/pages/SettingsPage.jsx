import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Shield, Eye, PenTool } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import api from '../services/api';

export default function SettingsPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userRes = await authAPI.getCurrentUser();
      setCurrentUser(userRes.data);

      if (userRes.data.role === 'admin') {
        const usersRes = await api.get('/users');
        setUsers(usersRes.data);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      await api.post('/users', {
        username: formData.get('username'),
        email: formData.get('email'),
        full_name: formData.get('full_name'),
        password: formData.get('password')
      });

      toast.success('User created');
      setShowCreateModal(false);
      loadData();
      e.target.reset();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Delete this user?')) return;

    try {
      await api.delete(`/users/${userId}`);
      toast.success('User deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await api.put(`/users/${userId}/role`, newRole);
      toast.success('Role updated');
      setShowRoleModal(false);
      loadData();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-red-600" />;
      case 'editor':
        return <PenTool className="w-4 h-4 text-blue-600" />;
      case 'viewer':
        return <Eye className="w-4 h-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Administrator',
      editor: 'Editor',
      viewer: 'Viewer'
    };
    return labels[role] || role;
  };

  const getRoleDescription = (role) => {
    const descriptions = {
      admin: 'Full access to all features',
      editor: 'Can manage content and playlists',
      viewer: 'Read-only access to statistics'
    };
    return descriptions[role] || '';
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      {/* Current User Section */}
      <div className="card mb-8">
        <h2 className="text-xl font-bold mb-4">Your Account</h2>
        <div className="space-y-3">
          <p>
            <strong>Username:</strong> {currentUser?.username}
          </p>
          <p>
            <strong>Email:</strong> {currentUser?.email}
          </p>
          <p className="flex items-center gap-2">
            <strong>Role:</strong>
            <span className="flex items-center gap-1 px-3 py-1 rounded bg-gray-100">
              {getRoleIcon(currentUser?.role)}
              {getRoleLabel(currentUser?.role)}
            </span>
          </p>
        </div>
      </div>

      {/* User Management (Admin Only) */}
      {currentUser?.role === 'admin' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Users</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add User
            </button>
          </div>

          {users.length === 0 ? (
            <div className="card text-center py-8 text-gray-500">
              <p>No users yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{user.full_name || user.username}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>

                      <div className="flex items-center gap-2 mt-2">
                        {getRoleIcon(user.role)}
                        <span className="text-sm font-medium">{getRoleLabel(user.role)}</span>
                        <span className="text-xs text-gray-500">
                          {getRoleDescription(user.role)}
                        </span>
                      </div>

                      {user.last_login && (
                        <p className="text-xs text-gray-500 mt-2">
                          Last login: {new Date(user.last_login).toLocaleString()}
                        </p>
                      )}

                      <span className={`inline-block mt-2 text-xs px-2 py-1 rounded ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {user.id !== currentUser.id && (
                        <>
                          <button
                            onClick={() => {
                              setEditingUser(user);
                              setShowRoleModal(true);
                            }}
                            className="btn btn-secondary flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Change Role
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="btn btn-danger flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Create User</h2>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="label">Username</label>
                <input
                  type="text"
                  name="username"
                  className="input"
                  minLength={3}
                  required
                />
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  name="password"
                  className="input"
                  minLength={6}
                  maxLength={72}
                  required
                />
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary flex-1">
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {showRoleModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">
              Change Role: {editingUser.username}
            </h2>

            <div className="space-y-3 mb-6">
              {['admin', 'editor', 'viewer'].map((role) => (
                <button
                  key={role}
                  onClick={() => handleChangeRole(editingUser.id, role)}
                  className={`w-full p-4 border rounded-lg text-left transition-all ${
                    editingUser.role === role
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getRoleIcon(role)}
                    <span className="font-semibold">{getRoleLabel(role)}</span>
                  </div>
                  <p className="text-sm text-gray-600">{getRoleDescription(role)}</p>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setShowRoleModal(false);
                setEditingUser(null);
              }}
              className="btn btn-secondary w-full"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
