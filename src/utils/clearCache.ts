/**
 * Utility to completely clear all cached Firebase data and force fresh login
 */

export const clearAllFirebaseCache = async () => {
  try {
    console.log('🧹 Clearing all Firebase cache and local storage...');
    
    // Clear all localStorage
    localStorage.clear();
    
    // Clear all sessionStorage  
    sessionStorage.clear();
    
    // Clear all cookies for the current domain
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Clear IndexedDB (Firebase uses this)
    if ('indexedDB' in window) {
      const databases = await indexedDB.databases();
      databases.forEach(db => {
        if (db.name) {
          indexedDB.deleteDatabase(db.name);
        }
      });
    }
    
    // Clear Cache Storage
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    
    console.log('✅ All cache cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    return false;
  }
};

export const forceFirebaseRefresh = () => {
  console.log('🔄 Forcing Firebase refresh...');
  
  // Force reload the page to ensure fresh Firebase initialization
  window.location.reload();
};
