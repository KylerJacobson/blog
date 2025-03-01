import { AuthContext } from '../contexts/AuthContext';
import { useContext, useCallback } from 'react';

// Create a hook version for components
export const useAnalytics = () => {
  const { currentUser } = useContext(AuthContext);
  
  // Use useCallback to recreate this function when currentUser changes
  const trackPageView = useCallback(() => {    
    // Don't send analytics if user is admin
    if (currentUser?.role === 1) {
      console.log('Analytics: Admin user, not tracking');
      return;
    } 
    
    // Get or create visitor ID
    let visitorId = localStorage.getItem('visitorId');
    if (!visitorId) {
      visitorId = crypto.randomUUID(); // Or use a UUID library
      localStorage.setItem('visitorId', visitorId);
    }

    try {
      fetch('/api/analytics/pageview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: window.location.pathname,
          referrer: document.referrer || null,
          visitorId: visitorId // Send the ID instead of relying on IP
        }),
      });
    } catch (e) {
      // Fail silently - analytics shouldn't break the app
      console.error('Analytics error:', e);
    }
  }, [currentUser]); // This dependency is critical
  
  return { trackPageView };
};