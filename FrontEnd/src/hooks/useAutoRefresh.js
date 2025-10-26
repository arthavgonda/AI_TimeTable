import { useState, useEffect, useRef } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { styled } from '@mui/system';

const UpdateNotification = styled(Snackbar)(({ theme }) => ({
  '& .MuiSnackbar-root': {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999,
  },
}));

/**
 * Custom hook for auto-refreshing data
 * @param {Function} refetchFn - Function to call for refreshing data
 * @param {Object} options - Configuration options
 * @param {number} options.interval - Refresh interval in ms (default: 30000 = 30s)
 * @param {boolean} options.enabled - Whether auto-refresh is enabled (default: true)
 * @param {boolean} options.showNotifications - Show update notifications (default: true)
 * @param {Function} options.onUpdate - Callback when data updates
 */
export const useAutoRefresh = (refetchFn, options = {}) => {
  const {
    interval = 30000,
    enabled = true,
    showNotifications = true,
    onUpdate,
  } = options;

  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef(null);
  const previousDataRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;


    intervalRef.current = setInterval(async () => {
      try {
        if (refetchFn) {
          await refetchFn();
          

          const hasChanged = previousDataRef.current !== null;
          if (hasChanged && showNotifications) {
            setShowUpdateNotification(true);
            setLastUpdate(new Date());
            

            setTimeout(() => {
              setShowUpdateNotification(false);
            }, 3000);
          }
          
          previousDataRef.current = Date.now();
        }
      } catch (error) {
        console.error('Auto-refresh error:', error);
      }
    }, interval);


    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refetchFn, interval, enabled, showNotifications]);


  useEffect(() => {
    if (onUpdate && previousDataRef.current !== null) {
      onUpdate();
    }
  }, [previousDataRef.current, onUpdate]);

  const NotificationComponent = showNotifications && showUpdateNotification ? (
    <Snackbar
      open={showUpdateNotification}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      autoHideDuration={3000}
      onClose={() => setShowUpdateNotification(false)}
    >
      <Alert 
        onClose={() => setShowUpdateNotification(false)} 
        severity="info"
        sx={{ width: '100%' }}
        variant="filled"
      >
        📊 Data updated
      </Alert>
    </Snackbar>
  ) : null;

  return { NotificationComponent, lastUpdate };
};

export default useAutoRefresh;

