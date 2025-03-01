import { AuthContext } from '../contexts/AuthContext';
import { useContext } from 'react';

// Create a hook version for components
export const useAnalytics = () => {
  const { currentUser } = useContext(AuthContext);
  
  const trackPageView = () => {    
    // Don't send analytics if user is admin
    if (currentUser?.role === 1) {
      console.log('Analytics: Admin user, not tracking');
      return;
    } 
    
    try {
      fetch('/api/analytics/pageview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: window.location.pathname,
          referrer: document.referrer || null,
        }),
      });
    } catch (e) {
      // Fail silently - analytics shouldn't break the app
      console.error('Analytics error:', e);
    }
  };
  
  return { trackPageView };
};