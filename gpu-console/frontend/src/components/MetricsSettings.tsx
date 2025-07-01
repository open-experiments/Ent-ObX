import { useState } from 'react';
import { metricsStorage } from '../utils/metricsStorage';
import { CogIcon, TrashIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface MetricsSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MetricsSettings({ isOpen, onClose }: MetricsSettingsProps) {
  const [retentionMinutes, setRetentionMinutes] = useState(30);
  const [storageStats, setStorageStats] = useState(() => metricsStorage.getStorageStats());

  const handleUpdateRetention = () => {
    metricsStorage.setDefaultTTL(retentionMinutes);
    alert(`✅ Data retention set to ${retentionMinutes} minutes`);
  };

  const handleClearData = () => {
    if (confirm('⚠️ Are you sure you want to clear all stored metrics data?')) {
      metricsStorage.clearAll();
      setStorageStats(metricsStorage.getStorageStats());
      alert('🗑️ All metrics data cleared');
    }
  };

  const handleRefreshStats = () => {
    setStorageStats(metricsStorage.getStorageStats());
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <CogIcon className="w-5 h-5 mr-2" />
            Metrics Settings
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Data Retention Setting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Retention Duration
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="5"
                max="1440"
                value={retentionMinutes}
                onChange={(e) => setRetentionMinutes(Number(e.target.value))}
                className="border rounded px-3 py-2 w-20 text-center"
              />
              <span className="text-sm text-gray-600">minutes</span>
              <button
                onClick={handleUpdateRetention}
                className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Update
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              How long to keep metrics data (5-1440 minutes)
            </p>
          </div>

          {/* Storage Statistics */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Storage Statistics</h4>
              <button
                onClick={handleRefreshStats}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Refresh
              </button>
            </div>
            <div className="bg-gray-50 rounded p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>GPUs with Data:</span>
                <span className="font-medium">{storageStats.totalGPUs}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Data Points:</span>
                <span className="font-medium">{storageStats.totalDataPoints.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Storage Used:</span>
                <span className="font-medium">{formatBytes(storageStats.storageSize)}</span>
              </div>
              {storageStats.oldestData && (
                <div className="flex justify-between">
                  <span>Oldest Data:</span>
                  <span className="font-medium text-xs">
                    {storageStats.oldestData.toLocaleTimeString()}
                  </span>
                </div>
              )}
              {storageStats.newestData && (
                <div className="flex justify-between">
                  <span>Newest Data:</span>
                  <span className="font-medium text-xs">
                    {storageStats.newestData.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleClearData}
              className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              Clear All Data
            </button>
          </div>

          {/* Info */}
          <div className="bg-blue-50 rounded p-3">
            <div className="flex items-start">
              <InformationCircleIcon className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">How it works:</p>
                <ul className="text-xs space-y-1">
                  <li>• Data is stored in browser localStorage</li>
                  <li>• Persists across page reloads</li>
                  <li>• Automatically expires after retention period</li>
                  <li>• Maximum 50 data points per GPU</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}