import { useState, useEffect } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PlaylistPreview({ playlist }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playInterval, setPlayInterval] = useState(null);

  useEffect(() => {
    if (isPlaying && playlist?.items_detailed?.length > 0) {
      const currentItem = playlist.items_detailed[currentIndex];
      const duration = currentItem.duration * 1000;

      const interval = setInterval(() => {
        setCurrentIndex((prev) => {
          const next = prev + 1;
          if (next >= playlist.items_detailed.length) {
            if (playlist.loop) {
              return 0;
            } else {
              setIsPlaying(false);
              return prev;
            }
          }
          return next;
        });
      }, duration);

      setPlayInterval(interval);
      return () => clearInterval(interval);
    }

    return () => {
      if (playInterval) clearInterval(playInterval);
    };
  }, [isPlaying, currentIndex, playlist]);

  if (!playlist?.items_detailed || playlist.items_detailed.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg p-8 text-center text-gray-400">
        No items in playlist
      </div>
    );
  }

  const current = playlist.items_detailed[currentIndex];
  const totalItems = playlist.items_detailed.length;

  return (
    <div className="space-y-4">
      {/* Preview Image/Video */}
      <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
        {current.content_item.mime_type?.startsWith('image') ? (
          <img
            src={current.content_item.file_path}
            alt="Preview"
            className="w-full h-full object-contain"
          />
        ) : (
          <video
            src={current.content_item.file_path}
            className="w-full h-full object-contain"
            autoPlay
            muted
          />
        )}
      </div>

      {/* Info */}
      <div className="bg-white p-4 rounded-lg">
        <p className="text-sm text-gray-600 mb-1">
          Item {currentIndex + 1} of {totalItems}
        </p>
        <h3 className="font-semibold truncate">
          {current.content_item.item_number ? `Page ${current.content_item.item_number}` : 'Content'}
        </h3>
        <p className="text-xs text-gray-500">Duration: {current.duration}s</p>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="btn btn-secondary flex-1 flex items-center justify-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Prev
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="btn btn-primary flex-1 flex items-center justify-center gap-2"
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Play
            </>
          )}
        </button>

        <button
          onClick={() => setCurrentIndex(Math.min(totalItems - 1, currentIndex + 1))}
          disabled={currentIndex === totalItems - 1}
          className="btn btn-secondary flex-1 flex items-center justify-center gap-2"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Progress */}
      <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className="bg-primary-600 h-full transition-all"
          style={{ width: `${((currentIndex + 1) / totalItems) * 100}%` }}
        />
      </div>

      {/* Info */}
      {playlist.shuffle && (
        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded text-center">
          🔀 Shuffle enabled
        </div>
      )}
      {playlist.loop && (
        <div className="text-xs text-green-600 bg-green-50 p-2 rounded text-center">
          🔁 Loop enabled
        </div>
      )}
    </div>
  );
}
