const trackPageView = () => {
  // Don't track in development
  // TODO enable this in production
  // if (process.env.NODE_ENV !== 'production') return;
  
  // Don't send analytics if user is admin (optional)
  const isAdmin = localStorage.getItem('userRole') === '1';
  if (isAdmin) return;
  
  try {
    fetch('/api/analytics/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: window.location.pathname,
        referrer: document.referrer || null,
      }),
      // No need for credentials if you're just logging anonymous stats
    });
  } catch (e) {
    // Fail silently - analytics shouldn't break the app
    console.error('Analytics error:', e);
  }
};

export { trackPageView };