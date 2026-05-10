import React, { useEffect, useState } from 'react';
import { CloudOff, CloudLightning, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * OfflineSync Component
 * Periodically checks for saved offline reports and attempts to sync them when online.
 */
const OfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkQueue();

    // Periodic sync attempt (every 30 seconds)
    const interval = setInterval(() => {
      if (navigator.onLine) {
        syncQueue();
      }
      checkQueue();
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (isOnline) {
      syncQueue();
    }
  }, [isOnline]);

  const checkQueue = () => {
    const queue = JSON.parse(localStorage.getItem('offline_disaster_reports') || '[]');
    setPendingCount(queue.length);
  };

  const syncQueue = async () => {
    const queue = JSON.parse(localStorage.getItem('offline_disaster_reports') || '[]');
    if (queue.length === 0) return;

    setSyncStatus('syncing');
    console.log(`Syncing ${queue.length} offline reports...`);

    const failed = [];
    const successful = [];

    for (const item of queue) {
      try {
        const response = await fetch('http://localhost:5000/api/disaster/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data),
        });

        if (response.ok) {
          successful.push(item.id);
        } else {
          failed.push(item);
        }
      } catch (err) {
        failed.push(item);
      }
    }

    if (successful.length > 0) {
      localStorage.setItem('offline_disaster_reports', JSON.stringify(failed));
      setSyncStatus('success');
      setPendingCount(failed.length);
      
      // Clear status after 5 seconds
      setTimeout(() => setSyncStatus('idle'), 5000);
    } else {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 5000);
    }
  };

  if (pendingCount === 0 && isOnline) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      zIndex: 10000,
      background: '#1a1a2e',
      border: '1px solid #333',
      borderRadius: '12px',
      padding: '12px 16px',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
      animation: 'slideIn 0.3s ease-out'
    }}>
      {!isOnline ? (
        <CloudOff size={20} color="#ef4444" />
      ) : syncStatus === 'syncing' ? (
        <CloudLightning size={20} color="#3b82f6" className="spin-animation" />
      ) : syncStatus === 'success' ? (
        <CheckCircle2 size={20} color="#10b981" />
      ) : (
        <AlertCircle size={20} color="#f59e0b" />
      )}

      <div>
        <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
          {!isOnline ? 'Offline Mode Active' : syncStatus === 'syncing' ? 'Syncing Reports...' : 'Sync Complete'}
        </div>
        <div style={{ fontSize: '11px', color: '#888' }}>
          {pendingCount > 0 ? `${pendingCount} report(s) waiting for sync` : 'All reports synchronized'}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .spin-animation {
          animation: spin 2s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default OfflineSync;
