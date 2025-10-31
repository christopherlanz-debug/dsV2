import { useState, useEffect } from 'react';
import { playlistsAPI, contentAPI, screensAPI } from '../services/api';
import { Plus, Trash2, Edit, Eye, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import PlaylistDragDrop from '../components/DragDropPlaylist/PlaylistDragDrop';
import PlaylistPreview from '../components/PlaylistPreview/PlaylistPreview';
import ScreenLiveView from '../components/ScreenLiveView/ScreenLiveView';
import ScheduleManager from '../components/ScheduleManager/ScheduleManager';

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState([]);
  const [allContent, setAllContent] = useState([]);
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editingPlaylistData, setEditingPlaylistData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showBatchAssign, setShowBatchAssign] = useState(false);
  const [showScheduleManager, setShowScheduleManager] = useState(false);
  const [selectedPlaylists, setSelectedPlaylists] = useState(new Set());
  const [selectedScreens, setSelectedScreens] = useState(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [playlistsRes, contentRes, screensRes] = await Promise.all([
        playlistsAPI.list(),
        contentAPI.list(),
        screensAPI.list()
      ]);
      setPlaylists(playlistsRes.data);
      setAllContent(contentRes.data);
      setScreens(screensRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      loop: formData.get('loop') === 'on',
      shuffle: formData.get('shuffle') === 'on'
    };

    try {
      if (editingPlaylist) {
        await playlistsAPI.update(editingPlaylist.id, data);
        toast.success('Playlist updated');
      } else {
        await playlistsAPI.create(data);
        toast.success('Playlist created');
      }
      setShowModal(false);
      setEditingPlaylist(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this playlist?')) return;

    try {
      await playlistsAPI.delete(id);
      toast.success('Playlist deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete playlist');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedPlaylists.size === 0) {
      toast.error('Select playlists to delete');
      return;
    }

    if (!confirm(`Delete ${selectedPlaylists.size} playlists?`)) return;

    try {
      for (const id of selectedPlaylists) {
        await playlistsAPI.delete(id);
      }
      toast.success(`Deleted ${selectedPlaylists.size} playlists`);
      setSelectedPlaylists(new Set());
      loadData();
    } catch (error) {
      toast.error('Failed to delete playlists');
    }
  };

  const openEditModal = (playlist) => {
    setEditingPlaylist(playlist);
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingPlaylist(null);
    setShowModal(true);
  };

  const openPlaylistEditor = async (playlist) => {
    try {
      const response = await playlistsAPI.getFull(playlist.id);
      setEditingPlaylistData(response.data);
      setShowEditorModal(true);
    } catch (error) {
      toast.error('Failed to load playlist details');
    }
  };

  const handleAddSchedule = async (playlistId, data) => {
    try {
      await playlistsAPI.createSchedule(playlistId, data);
      const response = await playlistsAPI.getFull(playlistId);
      setEditingPlaylistData(response.data);
      toast.success('Schedule created');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create schedule');
      throw error;
    }
  };

  const handleDeleteSchedule = async (playlistId, scheduleId) => {
    if (!confirm('Delete this schedule?')) return;
    try {
      await playlistsAPI.deleteSchedule(playlistId, scheduleId);
      const response = await playlistsAPI.getFull(playlistId);
      setEditingPlaylistData(response.data);
      toast.success('Schedule deleted');
    } catch (error) {
      toast.error('Failed to delete schedule');
    }
  };

  const handleUpdateSchedule = async (playlistId, scheduleId, data) => {
    try {
      await playlistsAPI.updateSchedule(playlistId, scheduleId, data);
      const response = await playlistsAPI.getFull(playlistId);
      setEditingPlaylistData(response.data);
      toast.success('Schedule updated');
    } catch (error) {
      toast.error('Failed to update schedule');
      throw error;
    }
  };

  const handleAddItem = async (contentItemId) => {
    if (!editingPlaylistData) return;

    try {
      const order = editingPlaylistData.items_detailed?.length || 0;
      await playlistsAPI.addItem(editingPlaylistData.id, {
        content_item_id: contentItemId,
        order: order,
        duration_override: null
      });

      const response = await playlistsAPI.getFull(editingPlaylistData.id);
      setEditingPlaylistData(response.data);
      toast.success('Item added');
    } catch (error) {
      toast.error('Failed to add item');
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (!editingPlaylistData) return;

    try {
      await playlistsAPI.removeItem(editingPlaylistData.id, itemId);
      const response = await playlistsAPI.getFull(editingPlaylistData.id);
      setEditingPlaylistData(response.data);
      toast.success('Item removed');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleReorder = async (newItems) => {
    if (!editingPlaylistData) return;

    try {
      await playlistsAPI.reorderItems(editingPlaylistData.id, 
        newItems.map((item, index) => ({ id: item.id, order: index }))
      );
      setEditingPlaylistData({
        ...editingPlaylistData,
        items_detailed: newItems
      });
      toast.success('Order updated');
    } catch (error) {
      toast.error('Failed to reorder');
    }
  };

  const handleDurationChange = async (itemId, duration) => {
    if (!editingPlaylistData) return;

    const item = editingPlaylistData.items_detailed.find(i => i.id === itemId);
    if (item) {
      item.duration = duration;
      setEditingPlaylistData({ ...editingPlaylistData });
    }
  };

  const getAvailableContentItems = () => {
    const items = [];
    allContent.forEach(content => {
      if (content.items?.length > 0) {
        content.items.forEach(item => {
          const isInPlaylist = editingPlaylistData?.items_detailed?.some(pi => pi.content_item.id === item.id);
          if (!isInPlaylist) {
            items.push({
              ...item,
              contentTitle: content.title,
              contentType: content.content_type
            });
          }
        });
      }
    });
    return items;
  };

  const getItemLabel = (item) => {
    if (item.contentType === 'pdf') {
      return `${item.contentTitle} - Page ${item.item_number}`;
    }
    return item.contentTitle;
  };

  const togglePlaylistSelection = (id) => {
    const newSelected = new Set(selectedPlaylists);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPlaylists(newSelected);
  };

  const toggleScreenSelection = (id) => {
    const newSelected = new Set(selectedScreens);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedScreens(newSelected);
  };

  const handleBatchAssign = async () => {
    if (selectedPlaylists.size === 0 || selectedScreens.size === 0) {
      toast.error('Select playlists and screens');
      return;
    }

    try {
      const playlistId = Array.from(selectedPlaylists)[0];
      
      for (const screenId of selectedScreens) {
        await screensAPI.update(screenId, { assigned_playlist_id: playlistId });
      }
      
      toast.success(`Assigned to ${selectedScreens.size} screens`);
      setShowBatchAssign(false);
      setSelectedPlaylists(new Set());
      setSelectedScreens(new Set());
      loadData();
    } catch (error) {
      toast.error('Failed to assign');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Playlists</h1>
        <div className="flex gap-2">
          {selectedPlaylists.size > 0 && (
            <>
              <button
                onClick={() => setShowBatchAssign(true)}
                className="btn btn-primary"
              >
                Assign to Screens
              </button>
              <button
                onClick={handleBatchDelete}
                className="btn btn-danger"
              >
                Delete ({selectedPlaylists.size})
              </button>
            </>
          )}
          <button
            onClick={openCreateModal}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create
          </button>
        </div>
      </div>

      {playlists.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 mb-4">No playlists yet</p>
          <button onClick={openCreateModal} className="btn btn-primary">
            Create First Playlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((playlist) => (
            <div key={playlist.id} className="card">
              <div className="flex items-start gap-3 mb-3">
                <input
                  type="checkbox"
                  checked={selectedPlaylists.has(playlist.id)}
                  onChange={() => togglePlaylistSelection(playlist.id)}
                  className="w-4 h-4 mt-1"
                />
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">{playlist.name}</h3>
                  <p className="text-sm text-gray-600 truncate">
                    {playlist.description || 'No description'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 text-xs text-gray-600 mb-4">
                <span className={playlist.loop ? 'text-green-600' : ''}>
                  🔁 {playlist.loop ? 'Loop' : 'No Loop'}
                </span>
                <span className={playlist.shuffle ? 'text-blue-600' : ''}>
                  🔀 {playlist.shuffle ? 'Shuffle' : 'Sequential'}
                </span>
                <span>📝 {playlist.items?.length || 0} items</span>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => {
                    openPlaylistEditor(playlist);
                    setShowPreview(false);
                  }}
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    openPlaylistEditor(playlist);
                    setShowPreview(true);
                  }}
                  className="btn btn-secondary flex items-center justify-center gap-2 px-3 text-sm"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(playlist.id)}
                  className="btn btn-danger flex items-center justify-center gap-2 px-3 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">
              {editingPlaylist ? 'Edit Playlist' : 'Create Playlist'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input
                  type="text"
                  name="name"
                  className="input"
                  defaultValue={editingPlaylist?.name}
                  required
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  name="description"
                  className="input"
                  rows={3}
                  defaultValue={editingPlaylist?.description}
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="loop"
                    defaultChecked={editingPlaylist?.loop ?? true}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Loop</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="shuffle"
                    defaultChecked={editingPlaylist?.shuffle ?? false}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Shuffle</span>
                </label>
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingPlaylist ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPlaylist(null);
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

      {/* Editor Modal mit Tabs */}
      {showEditorModal && editingPlaylistData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="card max-w-5xl w-full my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {editingPlaylistData.name}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowScheduleManager(!showScheduleManager)}
                  className="btn btn-secondary text-sm"
                >
                  {showScheduleManager ? 'Hide' : 'Show'} Schedules
                </button>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="btn btn-secondary text-sm flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  {showPreview ? 'Hide' : 'Show'} Preview
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Items & Schedule */}
              <div className="lg:col-span-2">
                {showScheduleManager ? (
                  <ScheduleManager
                    playlistId={editingPlaylistData.id}
                    schedules={editingPlaylistData.schedules || []}
                    onAdd={handleAddSchedule}
                    onDelete={handleDeleteSchedule}
                    onUpdate={handleUpdateSchedule}
                    playlistsAPI={playlistsAPI}
                  />
                ) : (
                  <>
                    <h3 className="font-semibold mb-3">Manage Items</h3>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <PlaylistDragDrop
                        items={editingPlaylistData.items_detailed || []}
                        onReorder={handleReorder}
                        onRemove={handleRemoveItem}
                        onDurationChange={handleDurationChange}
                      />
                    </div>

                    <h3 className="font-semibold mb-3">Available Items</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {getAvailableContentItems().length > 0 ? (
                        getAvailableContentItems().map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <span className="text-sm truncate flex-1">
                              {getItemLabel(item)}
                            </span>
                            <button
                              onClick={() => handleAddItem(item.id)}
                              className="btn btn-sm btn-primary"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                          All items added
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Right: Preview */}
              {showPreview && (
                <div>
                  <h3 className="font-semibold mb-3">Preview</h3>
                  <PlaylistPreview playlist={editingPlaylistData} />
                </div>
              )}
            </div>

            <div className="mt-6">
              <button
                onClick={() => {
                  setShowEditorModal(false);
                  setEditingPlaylistData(null);
                  setShowPreview(false);
                  setShowScheduleManager(false);
                  loadData();
                }}
                className="btn btn-primary w-full"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Assign Modal */}
      {showBatchAssign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="card max-w-2xl w-full my-8">
            <h2 className="text-2xl font-bold mb-6">Batch Assign Playlist</h2>

            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Playlists */}
              <div>
                <h3 className="font-semibold mb-3">Selected Playlist</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {playlists.map((playlist) => (
                    selectedPlaylists.has(playlist.id) && (
                      <div key={playlist.id} className="p-3 bg-green-50 rounded flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="font-medium">{playlist.name}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Screens */}
              <div>
                <h3 className="font-semibold mb-3">Select Screens</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {screens.map((screen) => (
                    <label key={screen.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedScreens.has(screen.id)}
                        onChange={() => toggleScreenSelection(screen.id)}
                        className="w-4 h-4"
                      />
                      <div>
                        <p className="font-medium">{screen.name}</p>
                        <p className="text-xs text-gray-500">{screen.location}</p>
                      </div>
                      <span className={`ml-auto text-xs px-2 py-1 rounded ${
                        screen.is_online ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {screen.is_online ? 'Online' : 'Offline'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleBatchAssign}
                className="btn btn-primary flex-1"
              >
                Assign to {selectedScreens.size} Screen{selectedScreens.size !== 1 ? 's' : ''}
              </button>
              <button
                onClick={() => {
                  setShowBatchAssign(false);
                  setSelectedScreens(new Set());
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
