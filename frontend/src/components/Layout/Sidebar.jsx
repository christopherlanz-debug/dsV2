import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Image,
  Grid,
  Play,
  Settings,
  LogOut,
  Menu,
  X,
  Users,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const getLinkClass = (path) => `
    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
    ${isActive(path)
      ? 'bg-primary-100 text-primary-700 font-medium'
      : 'text-gray-700 hover:bg-gray-100'
    }
  `;

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 lg:hidden z-40 p-2 hover:bg-gray-100 rounded-lg"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 z-30 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo/Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-primary-600">
            📺 Digital Signage
          </h1>
          <p className="text-xs text-gray-500 mt-1">v2.0</p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Dashboard */}
          <Link to="/" className={getLinkClass('/')}>
            <Home className="w-5 h-5 flex-shrink-0" />
            <span>Dashboard</span>
          </Link>

          {/* Content Management */}
          <div className="pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase px-4 mb-2">
              Content
            </p>
            <Link to="/content" className={getLinkClass('/content')}>
              <Image className="w-5 h-5 flex-shrink-0" />
              <span>Content Library</span>
            </Link>
          </div>

          {/* Playlist Management */}
          <div className="pt-2">
            <p className="text-xs font-semibold text-gray-500 uppercase px-4 mb-2">
              Playlists
            </p>
            <Link to="/playlists" className={getLinkClass('/playlists')}>
              <Play className="w-5 h-5 flex-shrink-0" />
              <span>Manage Playlists</span>
            </Link>
          </div>

          {/* Screens & Admin (nur für Admin & Editor) */}
          {user?.role === 'admin' && (
            <div className="pt-2">
              <p className="text-xs font-semibold text-gray-500 uppercase px-4 mb-2">
                Administration
              </p>
              <Link to="/screens" className={getLinkClass('/screens')}>
                <Grid className="w-5 h-5 flex-shrink-0" />
                <span>Screens</span>
              </Link>
              <Link to="/settings" className={getLinkClass('/settings')}>
                <Users className="w-5 h-5 flex-shrink-0" />
                <span>Users & Settings</span>
              </Link>
            </div>
          )}

          {/* Analytics (optional für alle) */}
          <div className="pt-2">
            <p className="text-xs font-semibold text-gray-500 uppercase px-4 mb-2">
              Analytics
            </p>
            <div className="px-4 py-3 rounded-lg text-gray-500 flex items-center gap-3 cursor-not-allowed opacity-50">
              <BarChart3 className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">Reports</span>
              <span className="ml-auto text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Soon
              </span>
            </div>
          </div>

          {/* Settings (nur für aktuellen User) */}
          <div className="pt-2">
            <p className="text-xs font-semibold text-gray-500 uppercase px-4 mb-2">
              Personal
            </p>
            <Link to="/settings" className={getLinkClass('/settings')}>
              <Settings className="w-5 h-5 flex-shrink-0" />
              <span>My Settings</span>
            </Link>
          </div>
        </nav>

        {/* User Info & Logout */}
        <div className="border-t border-gray-200 p-4 space-y-3">
          <div className="px-4 py-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">Logged in as</p>
            <p className="font-semibold text-sm truncate">{user?.full_name || user?.username}</p>
            <p className="text-xs text-gray-500">
              {user?.role === 'admin' && '👤 Administrator'}
              {user?.role === 'editor' && '✏️ Editor'}
              {user?.role === 'viewer' && '👁️ Viewer'}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-20"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Content Offset */}
      <div className="hidden lg:block w-64" />
    </>
  );
}
