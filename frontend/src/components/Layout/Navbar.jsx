import { useState, useEffect } from 'react';
import { Bell, Settings, User, LogOut, Moon, Sun, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Navbar() {
  const [isDark, setIsDark] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Load theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    setIsDark(savedTheme === 'dark');
  }, []);

  useEffect(() => {
    // Simulate loading notifications (in production, would be from API/WebSocket)
    const mockNotifications = [
      { id: 1, message: 'Screen01 went offline', time: '2 min ago', type: 'warning' },
      { id: 2, message: 'New playlist assigned to Screen02', time: '15 min ago', type: 'info' },
      { id: 3, message: 'Content upload successful', time: '1 hour ago', type: 'success' }
    ];
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.length);
  }, []);

  const handleThemeToggle = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    toast.success(`Theme changed to ${newTheme}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const markNotificationsAsRead = () => {
    setUnreadCount(0);
    setShowNotifications(false);
    toast.success('Notifications marked as read');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-l-4 border-yellow-400';
      case 'success':
        return 'bg-green-50 border-l-4 border-green-400';
      case 'error':
        return 'bg-red-50 border-l-4 border-red-400';
      default:
        return 'bg-blue-50 border-l-4 border-blue-400';
    }
  };

  return (
    <nav className="fixed top-0 right-0 left-0 lg:left-64 bg-white border-b border-gray-200 z-20 shadow-sm">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left: Search */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search content, playlists..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4 ml-auto">
          {/* Theme Toggle */}
          <button
            onClick={handleThemeToggle}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-40">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold flex items-center justify-between">
                    Notifications
                    {unreadCount > 0 && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </h3>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No notifications</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${getNotificationColor(notification.type)}`}
                      >
                        <div className="flex gap-3">
                          <span className="text-lg flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="p-3 border-t border-gray-200 text-center">
                    <button
                      onClick={markNotificationsAsRead}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Mark all as read
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary-600" />
              </div>
              <span className="text-sm font-medium text-gray-900 hidden sm:block">
                {user?.full_name || user?.username}
              </span>
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-40">
                {/* User Info */}
                <div className="p-4 border-b border-gray-200">
                  <p className="font-semibold text-gray-900">
                    {user?.full_name || user?.username}
                  </p>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase">
                      Role:
                    </span>
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      user?.role === 'admin'
                        ? 'bg-red-100 text-red-800'
                        : user?.role === 'editor'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user?.role === 'admin' && '👤 Administrator'}
                      {user?.role === 'editor' && '✏️ Editor'}
                      {user?.role === 'viewer' && '👁️ Viewer'}
                    </span>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate('/settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm">Profile</span>
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-200 p-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Spacing */}
      <div className="h-1 bg-gradient-to-r from-primary-500 to-primary-600 opacity-0 lg:opacity-100" />
    </nav>
  );
}
