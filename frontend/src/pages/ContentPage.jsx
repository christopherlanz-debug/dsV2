import { useState, useEffect } from 'react';
import { contentAPI } from '../services/api';
import { Upload, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ContentCard from '../components/Content/ContentCard';

export default function ContentPage() {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const response = await contentAPI.list();
      setContent(response.data);
    } catch (error) {
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    // Validate file size
    const file = formData.get('file');
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must not exceed 50 MB');
      return;
    }

    // Validate PDF pages (estimate: 100KB per page)
    if (file.type === 'application/pdf') {
      const estimatedPages = Math.ceil(file.size / 100000);
      if (estimatedPages > 500) {
        toast.error('PDF seems to have too many pages (max 500)');
        return;
      }
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const response = await contentAPI.upload(formData);
      toast.success(response.data.message);
      setShowUploadModal(false);
      setUploadProgress(0);
      loadContent();
      e.target.reset();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Upload failed';
      toast.error(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this content and all its items?')) return;

    try {
      await contentAPI.delete(id);
      toast.success('Content deleted');
      loadContent();
    } catch (error) {
      toast.error('Failed to delete content');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Content Library</h1>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Upload className="w-5 h-5" />
          Upload Content
        </button>
      </div>

      {content.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 mb-4">No content yet</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary"
          >
            Upload Your First Content
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {content.map((item) => (
            <ContentCard
              key={item.id}
              content={item}
              onDelete={handleDelete}
              onEdit={() => {}}
            />
          ))}
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="card max-w-md w-full my-8">
            <h2 className="text-2xl font-bold mb-4">Upload Content</h2>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="label">Title *</label>
                <input
                  type="text"
                  name="title"
                  className="input"
                  placeholder="e.g., Welcome Banner"
                  required
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  name="description"
                  className="input"
                  rows={2}
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="label">Duration (seconds) *</label>
                <input
                  type="number"
                  name="duration"
                  className="input"
                  defaultValue={10}
                  min={1}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  How long each item is displayed (for PDFs: per page)
                </p>
              </div>

              <div>
                <label className="label">File *</label>
                <input
                  type="file"
                  name="file"
                  className="input"
                  accept="image/*,video/*,.pdf"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Max 50 MB • Supported: Images, Videos, PDFs
                </p>
              </div>

              {uploadProgress > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadProgress(0);
                  }}
                  className="btn btn-secondary"
                  disabled={uploading}
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
