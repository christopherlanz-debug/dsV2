import { useState, useEffect } from 'react';
import { screensAPI, contentAPI, playlistsAPI } from '../services/api';
import { Activity, Files, Play, Monitor } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    screens: 0,
    content: 0,
    playlists: 0,
    connected: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('Loading dashboard data...');
      
      const [screensRes, contentRes, playlistsRes] = await Promise.all([
        screensAPI.list(),
        contentAPI.list(),
        playlistsAPI.list()
      ]);

      console.log('Responses:', { screensRes, contentRes, playlistsRes });

      const screens = screensRes.data || [];
      const content = contentRes.data || [];
      const playlists = playlistsRes.data || [];
      
      const connected = screens.filter(s => s.is_online).length;

      setStats({
        screens: screens.length,
        content: content.length,
        playlists: playlists.length,
        connected
      });
      
      console.log('Stats set:', { screens: screens.length, content: content.length, playlists: playlists.length, connected });
    } catch (error) {
      console.error('Dashboard error:', error);
      toast.error(`Failed to load stats: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Screens */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Screens</p>
              <p className="text-3xl font-bold text-gray-900">{stats.screens}</p>
            </div>
            <Monitor className="w-12 h-12 text-blue-200" />
          </div>
          <p className="text-xs text-green-600 mt-2">
            {stats.connected} online
          </p>
        </div>

        {/* Content */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Content Items</p>
              <p className="text-3xl font-bold text-gray-900">{stats.content}</p>
            </div>
            <Files className="w-12 h-12 text-green-200" />
          </div>
        </div>

        {/* Playlists */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Playlists</p>
              <p className="text-3xl font-bold text-gray-900">{stats.playlists}</p>
            </div>
            <Play className="w-12 h-12 text-purple-200" />
          </div>
        </div>

        {/* Status */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">System Status</p>
              <p className="text-3xl font-bold text-green-600">✓ Online</p>
            </div>
            <Activity className="w-12 h-12 text-green-200" />
          </div>
        </div>
      </div>

      {/* Welcome */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Welcome! 👋</h2>
        <p className="text-gray-600 mb-4">
          Your Digital Signage System is up and running. You can now:
        </p>
        <ul className="space-y-2 text-gray-600">
          <li>📁 Upload content (images, videos, PDFs)</li>
          <li>📺 Create and manage playlists</li>
          <li>🖥️ Assign playlists to screens</li>
          <li>⏰ Set schedules for automatic playlist switching</li>
          <li>👥 Manage users and permissions</li>
        </ul>
      </div>
    </div>
  );
}
