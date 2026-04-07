
export function loadGoogleMapsScript() {
  return new Promise((resolve, reject) => {
    
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      return;
    }

    
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      reject(new Error('VITE_GOOGLE_MAPS_API_KEY not found in environment'));
      return;
    }

    
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly&loading=async`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    
    document.head.appendChild(script);
  });
}
