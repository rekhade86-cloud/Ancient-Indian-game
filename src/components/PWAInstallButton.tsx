import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={isInstallable ? 'Install Chaupar app for offline play' : 'How to install Chaupar on mobile'}
        className={`inline-flex items-center justify-center gap-2 rounded-lg border border-[#d4af37]/45 bg-[#23140e]/90 text-[#f5deb0] hover:border-[#d4af37] hover:bg-[#321b12] active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#d4af37] ${
          compact ? 'min-h-[44px] px-3 text-xs font-medium' : 'min-h-[44px] px-4 py-2 text-sm font-medium'
        }`}
      >
        {isInstallable ? <Download className="w-4 h-4 text-[#d4af37]" /> : <Smartphone className="w-4 h-4 text-[#d4af37]" />}
        <span>{isInstallable ? 'Install Offline App' : isIOS ? 'Add to iPhone' : 'Install on Mobile'}</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-guide-title"
        >
          <div className="w-full max-w-sm rounded-2xl border border-[#d4af37]/40 bg-[#1c110c] p-6 text-[#f5ead6] shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <h3 id="pwa-guide-title" className="font-display text-lg font-bold text-[#f5deb0]">
                Play 100% Offline on Mobile
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close install instructions"
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[#c8b28e] hover:bg-white/5 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="mt-2 text-sm text-[#cbb89a] leading-relaxed">
              Dyut Krida caches all board art, rules, sound effects, and the Shakuni AI on your device so you can play anywhere with zero internet.
            </p>

            {isIOS ? (
              <ol className="mt-4 space-y-2.5 text-sm text-[#e8d9be]">
                <li>1. Tap the <strong>Share</strong> icon in Safari&apos;s bottom toolbar.</li>
                <li>2. Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                <li>3. Launch <strong>Chaupar</strong> from your Home Screen anytime offline.</li>
              </ol>
            ) : (
              <ol className="mt-4 space-y-2.5 text-sm text-[#e8d9be]">
                <li>1. Open your mobile browser menu (<strong>⋮</strong> in Chrome or Edge).</li>
                <li>2. Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
                <li>3. Launch fullscreen anytime — even in Airplane Mode.</li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full min-h-[44px] rounded-xl bg-[#8b0000] border border-[#d4af37]/60 text-sm font-semibold text-[#fff5dc] hover:bg-[#a30b0b] transition-colors cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
