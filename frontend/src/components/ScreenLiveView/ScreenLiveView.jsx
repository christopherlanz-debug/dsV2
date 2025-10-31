import { useState, useEffect } from 'react';
import { RefreshCw, Monitor } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ScreenLiveView({ screenId, screenName }) {
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refreshScreenshot();
      }, 5000); // Refresh every 5 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const refreshScreenshot = async () => {
    setLoading(true);
    try {
      // In a real implementation, you would call an API endpoint
      // that gets the current content being displayed on the screen
      // For now, we'll show a placeholder
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // This would come from the API in production
      setScreenshot({
        content: 'Currently displaying: Content Name',
        timestamp: new Date().toLocaleTimeString(),
        status: 'online'
      });
      setLastUpdate(new Date());
      
      toast.success('Screenshot updated');
    } catch (error) {
      toast.error('Failed to get screenshot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Monitor className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">Live View: {screenName}</h3>
        </div>
        <button
          onClick={refreshScreenshot}
          disabled={loading}
          className="btn btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Preview Area */}
      <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center mb-4 overflow-hidden">
        {screenshot ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <p className="text-lg font-semibold">{screenshot.content}</p>
              <p className="text-sm text-gray-400 mt-2">{screenshot.timestamp}</p>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400">
            <p>No screenshot yet</p>
            <p className="text-sm mt-2">Click Refresh to get a live screenshot</p>
          </div>
        )}
      </div>

      {/* Auto Refresh Toggle */}
      <label className="flex items-center gap-2 mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={autoRefresh}
          onChange={(e) => setAutoRefresh(e.target.checked)}
          className="w-4 h-4"
        />
        <span className="text-sm">Auto-refresh every 5 seconds</span>
      </label>

      {/* Info */}
      {lastUpdate && (
        <p className="text-xs text-gray-600">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
