import { useState, useRef } from 'react';
import { GripVertical, Trash2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PlaylistDragDrop({ items, onReorder, onRemove, onDurationChange }) {
  const [draggedId, setDraggedId] = useState(null);
  const [draggedOverId, setDraggedOverId] = useState(null);
  const dragStart = useRef(null);

  const handleDragStart = (e, id) => {
    setDraggedId(id);
    dragStart.current = id;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (id) => {
    setDraggedOverId(id);
  };

  const handleDragLeave = () => {
    setDraggedOverId(null);
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    
    if (dragStart.current && dragStart.current !== targetId) {
      const draggedIndex = items.findIndex(i => i.id === dragStart.current);
      const targetIndex = items.findIndex(i => i.id === targetId);
      
      const newItems = [...items];
      const [movedItem] = newItems.splice(draggedIndex, 1);
      newItems.splice(targetIndex, 0, movedItem);
      
      // Update order
      const reorderedItems = newItems.map((item, index) => ({
        ...item,
        order: index
      }));
      
      onReorder(reorderedItems);
    }
    
    setDraggedId(null);
    setDraggedOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDraggedOverId(null);
  };

  return (
    <div className="space-y-2">
      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Drag content items here to add them to the playlist
        </div>
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => handleDragStart(e, item.id)}
            onDragOver={handleDragOver}
            onDragEnter={() => handleDragEnter(item.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, item.id)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-3 p-3 bg-white border rounded-lg cursor-move transition-all ${
              draggedId === item.id ? 'opacity-50' : ''
            } ${
              draggedOverId === item.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
            }`}
          >
            <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0" />
            
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {item.contentTitle} 
                {item.contentType === 'pdf' && ` - Page ${item.item_number}`}
              </p>
              <p className="text-xs text-gray-500">Item #{item.order + 1}</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                <Clock className="w-3 h-3 text-gray-600" />
                <input
                  type="number"
                  min="1"
                  value={item.duration}
                  onChange={(e) => onDurationChange(item.id, parseInt(e.target.value))}
                  className="w-10 bg-transparent text-sm text-center border-none outline-none"
                  title="Duration in seconds"
                />
                <span className="text-xs text-gray-600">s</span>
              </div>

              <button
                onClick={() => onRemove(item.id)}
                className="text-red-600 hover:text-red-800 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
