/**
 * Google Analytics tracking utilities
 * 
 * To set up Google Analytics:
 * 1. Create a Google Analytics 4 property at https://analytics.google.com
 * 2. Get your Measurement ID (format: G-XXXXXXXXXX)
 * 3. Add it to your .env file as VITE_GA_MEASUREMENT_ID
 * 4. The script will automatically load and start tracking
 */

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'set' | 'js',
      targetId: string | Date | { [key: string]: any },
      config?: { [key: string]: any }
    ) => void;
    dataLayer: any[];
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

/**
 * Initialize Google Analytics
 */
export function initAnalytics() {
  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'your_ga_measurement_id_here') {
    console.warn('Google Analytics Measurement ID not configured');
    return;
  }

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
  });

  // Load the Google Analytics script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

/**
 * Track a page view
 */
export function trackPageView(path: string) {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: path,
  });
}

/**
 * Track a custom event
 */
export function trackEvent(
  eventName: string,
  eventParams?: {
    [key: string]: any;
  }
) {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;

  window.gtag('event', eventName, eventParams);
}

/**
 * Track movie/TV show actions
 */
export const analytics = {
  trackMovieAdded: (contentType: 'movie' | 'tv') => {
    trackEvent('add_content', {
      content_type: contentType,
    });
  },
  trackMovieWatched: (contentType: 'movie' | 'tv') => {
    trackEvent('mark_watched', {
      content_type: contentType,
    });
  },
  trackMovieWatching: () => {
    trackEvent('start_watching');
  },
  trackMovieRemoved: (contentType: 'movie' | 'tv') => {
    trackEvent('remove_content', {
      content_type: contentType,
    });
  },
  trackPickRandom: (contentType: 'movie' | 'tv') => {
    trackEvent('pick_random', {
      content_type: contentType,
    });
  },
  trackContentTypeSwitch: (type: 'movie' | 'tv') => {
    trackEvent('switch_content_type', {
      content_type: type,
    });
  },
  trackTabSwitch: (tab: 'unwatched' | 'watching' | 'watched') => {
    trackEvent('switch_tab', {
      tab,
    });
  },
};

