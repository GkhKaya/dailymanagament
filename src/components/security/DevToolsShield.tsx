'use client';

import { useEffect } from 'react';

/**
 * DevToolsShield
 * Web sitesinde 'İncele' (Inspect Element), kaynak kod görüntüleme ve
 * geliştirici araçları kısayollarını engelleyen güvenlik kalkanı.
 */
export function DevToolsShield() {
  useEffect(() => {
    // Sadece tarayıcı ortamında çalışır
    if (typeof window === 'undefined') return;

    // 1. Sağ tık (Context Menu) engelleme
    const handleContextMenu = (e: MouseEvent) => {
      // Form input ve textarea alanlarında metin kopyalama/yapıştırmaya izin ver
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      e.preventDefault();
      return false;
    };

    // 2. DevTools kısayollarını engelleme
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // F12 -> DevTools
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+I veya Cmd+Option+I -> Inspect Element
      if (cmdOrCtrl && (e.shiftKey || (isMac && e.altKey)) && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+J veya Cmd+Option+J -> Console
      if (cmdOrCtrl && (e.shiftKey || (isMac && e.altKey)) && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+C veya Cmd+Option+C -> Element Selector
      if (cmdOrCtrl && (e.shiftKey || (isMac && e.altKey)) && (e.key === 'C' || e.key === 'c' || e.keyCode === 67)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+U veya Cmd+Option+U -> View Page Source
      if (cmdOrCtrl && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+S veya Cmd+S -> Save Page Source
      if (cmdOrCtrl && (e.key === 'S' || e.key === 's' || e.keyCode === 83)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // 3. Konsolu koruma ve uyarı basma
    if (process.env.NODE_ENV === 'production') {
      try {
        const warnStyle = 'color: #ef4444; font-size: 24px; font-weight: bold; -webkit-text-stroke: 1px black;';
        const textStyle = 'color: #f59e0b; font-size: 14px;';
        console.clear();
        console.log('%cDUR!', warnStyle);
        console.log(
          '%cBu alan geliştiricilere özeldir. Buraya herhangi bir kod yapıştırmak veya çalıştırmak hesabınızın güvenliğini tehlikeye atabilir.',
          textStyle
        );
      } catch {}
    }

    document.addEventListener('contextmenu', handleContextMenu, { capture: true });
    window.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, []);

  return null;
}
