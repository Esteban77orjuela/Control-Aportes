export const registerSW = async (): Promise<void> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('Service Worker no soportado');
    return;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('Service Worker deshabilitado en desarrollo');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('Service Worker registrado:', registration.scope);

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('Nueva versión disponible, recargando...');
            window.location.reload();
          }
        });
      }
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    if (registration.sync) {
      try {
        await registration.sync.register('offline-sync');
      } catch (e) {
        console.warn('Background sync registration failed:', e);
      }
    }
  } catch (error) {
    console.error('Error registrando Service Worker:', error);
  }
};

export const unregisterSW = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
  }
};

export const checkForUpdate = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    return true;
  } catch (error) {
    console.error('Error checking for update:', error);
    return false;
  }
};