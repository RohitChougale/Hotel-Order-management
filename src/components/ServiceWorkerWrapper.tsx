import { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

export default function ServiceWorkerWrapper() {
  const [needRefresh, setNeedRefresh] = useState(false);

  useEffect(() => {
    const updateSW = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {
        console.log('App is ready to work offline');
      },
    });
  }, []);

  const reloadPage = () => {
    window.location.reload();
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-4 py-2 rounded shadow-lg z-50">
      <p className="text-sm font-semibold">
        New version available.{' '}
        <button onClick={reloadPage} className="underline ml-1">
          Click to refresh
        </button>
      </p>
    </div>
  );
}
