import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export default function ContentCard({ content, onDelete }) {
  const [showItems, setShowItems] = useState(false);

  const getContentTypeEmoji = (type) => {
    switch (type) {
      case 'image':
        return '🖼️';
      case 'video':
        return '🎥';
      case 'pdf':
        return '📄';
      default:
        return '📦';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes, k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Get thumbnail path - handle both absolute and relative paths
  const getThumbnailSrc = () => {
    if (!content.thumbnail_path) return null;
    
    // If it's an absolute path, extract just the filename
    if (content.thumbnail_path.includes('/')) {
      return `/storage/${content.thumbnail_path.split('/').pop()}`;
    }
    return `/storage/${content.thumbnail_path}`;
  };

  const thumbnailSrc = getThumbnailSrc();

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="text-3xl">{getContentTypeEmoji(content.content_type)}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{content.title}</h3>
            <p className="text-sm text-gray-600 truncate">
              {content.file_name} • {formatFileSize(content.file_size)}
            </p>
          </div>
        </div>

        <button
          onClick={() => onDelete(content.id)}
          className="text-red-600 hover:text-red-800"
          title="Delete"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Thumbnail */}
      {thumbnailSrc && (
        <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
          <img
            src={thumbnailSrc}
            alt={content.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      {content.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{content.description}</p>
      )}

      <div className="flex gap-2 text-xs text-gray-600 mb-3">
        <span>⏱️ {content.duration}s</span>
        {content.pdf_page_count && (
          <span>📑 {content.pdf_page_count} pages</span>
        )}
        {content.items && (
          <span>📋 {content.items.length} items</span>
        )}
      </div>

      {/* Show PDF Pages/Content Items */}
      {content.items && content.items.length > 0 && (
        <div className="border-t pt-3">
          <button
            onClick={() => setShowItems(!showItems)}
            className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 w-full text-left"
          >
            {showItems ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {content.items.length} items
          </button>

          {showItems && (
            <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
              {content.items.map((item) => (
                <div
                  key={item.id}
                  className="text-xs bg-gray-50 p-2 rounded flex items-center justify-between"
                >
                  <span>
                    {content.content_type === 'pdf' ? `Page ${item.item_number}` : `Item ${item.item_number}`}
                  </span>
                  <span className="text-gray-500">{item.duration}s</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
