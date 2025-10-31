import { useState, useEffect } from 'react';
import { screensAPI, playlistsAPI, websocketAPI } from '../services/api';
import { Plus, Trash2, Edit, Wifi, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ScreensPage() {
  const [screens, setScreens] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingScreen, setEditingScreen] = useState(null);

  useEffect(() => {
    loadData();
    
    // Refresh online status every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [screensRes, playlistsRes] = await Promise.all([
        screensAPI.list(),
        playlistsAPI.list()
      ]);
      setScreens(screensRes.data);
      setPlaylists(playlistsRes.data);
    } catch (error) {
      toast.error('Failed to load screens');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      location: formData.get('location'),
      description: formData.get('description'),
      resolution_width: parseInt(formData.get('resolution_width')),
      resolution_height: parseInt(formData.get('resolution_height')),
      orientation: formData.get('orientation')
    };

    try {
      if (editingScreen) {
        await screensAPI.update(editingScreen.id, data);
        toast.success('Screen updated');
      } else {
        await screensAPI.create(data);
        toast.success('Screen created');
      }
      setShowModal(false);
      setEditingScreen(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this screen?')) return;
    
    try {
      await screensAPI.delete(id);
      toast.success('Screen deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete screen');
    }
  };

  const handleAssignPlaylist = async (screenId, playlistId) => {
    try {
      await screensAPI.update(screenId, {
        assigned_playlist_id: playlistId ? parseInt(playlistId) : null
      });
      toast.success('Playlist assigned');
      
      // Reload screen
      const screen = screens.find(s => s.id === screenId);
      if (screen && screen.is_online) {
        await websocketAPI.reloadScreen(screen.name);
        toast.success('Screen reload command sent');
      }
      
      loadData();
    } catch (error) {
      toast.error('Failed to assign playlist');
    }
  };

  const openEditModal = (screen) => {
    setEditingScreen(screen);
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingScreen(null);
    setShowModal(true);
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Screens</h1>
        <button
          onClick={openCreateModal}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Screen
        </button>
      </div>

      {screens.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 mb-4">No screens configured</p>
          <button onClick={openCreateModal} className="btn btn-primary">
            Add Your First Screen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {screens.map((screen) => (
            <div key={screen.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  {screen.is_online ? (
                    <Wifi className="w-5 h-5 text-green-600" />
                  ) : (
                    <WifiOff className="w-5 h-5 text-gray-400" />
                  )}
                  <h3 className="font-semibold text-lg">{screen.name}</h3>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    screen.is_online
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {screen.is_online ? 'Online' : 'Offline'}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p>📍 {screen.location || 'No location'}</p>
                <p>
                  📺 {screen.resolution_width}x{screen.resolution_height}
                </p>
                <p>🔄 {screen.orientation}</p>
              </div>

              <div className="mb-4">
                <label className="label text-xs">Assigned Playlist</label>
                <select
                  className="input text-sm"
                  value={screen.assigned_playlist_id || ''}
                  onChange={(e) =>
                    handleAssignPlaylist(screen.id, e.target.value)
                  }
                >
                  <option value="">No playlist</option>
                  {playlists.map((playlist) => (
                    <option key={playlist.id} value={playlist.id}>
                      {playlist.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(screen)}
                  className="btn btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(screen.id)}
                  className="btn btn-danger flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">
              {editingScreen ? 'Edit Screen' : 'Add Screen'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Screen Name</label>
                <input
                  type="text"
                  name="name"
                  className="input"
                  defaultValue={editingScreen?.name}
                  required
                />
              </div>

              <div>
                <label className="label">Location</label>
                <input
                  type="text"
                  name="location"
                  className="input"
                  defaultValue={editingScreen?.location}
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  name="description"
                  className="input"
                  rows={3}
                  defaultValue={editingScreen?.description}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Width</label>
                  <input
                    type="number"
                    name="resolution_width"
                    className="input"
                    defaultValue={editingScreen?.resolution_width || 1920}
                    required
                  />
                </div>
                <div>
                  <label className="label">Height</label>
                  <input
                    type="number"
                    name="resolution_height"
                    className="input"
                    defaultValue={editingScreen?.resolution_height || 1080}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Orientation</label>
                <select
                  name="orientation"
                  className="input"
                  defaultValue={editingScreen?.orientation || 'landscape'}
                >
                  <option value="landscape">Landscape</option>
                  <option value="portrait">Portrait</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingScreen ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingScreen(null);
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
