import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info, X } from 'lucide-react';

export default function InfoTooltip({ title, description, calculation, align = 'auto' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, placement: 'bottom' });
  const buttonRef = useRef(null);
  const tooltipRef = useRef(null);

  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const tooltipWidth = 310;
    const padding = 16;

    // Determine left position, ensuring it never overflows screen bounds
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    if (left < padding) left = padding;
    if (left + tooltipWidth > window.innerWidth - padding) {
      left = window.innerWidth - padding - tooltipWidth;
    }

    // Determine vertical placement (prefer below, but if near bottom flip above)
    let top = rect.bottom + 8;
    let placement = 'bottom';
    if (top + 180 > window.innerHeight && rect.top > 200) {
      top = rect.top - 8;
      placement = 'top';
    }

    setCoords({ top, left, placement });
  };

  const handleOpen = () => {
    updatePosition();
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => updatePosition();
    const handleClickOutside = (e) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target) &&
        tooltipRef.current && !tooltipRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-flex items-center">
      <button
        ref={buttonRef}
        type="button"
        onMouseEnter={handleOpen}
        onMouseLeave={() => setIsOpen(false)}
        onClick={(e) => {
          e.stopPropagation();
          if (isOpen) {
            setIsOpen(false);
          } else {
            handleOpen();
          }
        }}
        className="p-1 rounded-full text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
        aria-label="More information"
        title={title}
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {isOpen && typeof document !== 'undefined' && document.body && createPortal(
        <div
          ref={tooltipRef}
          style={{
            position: 'fixed',
            top: coords.placement === 'top' ? undefined : `${coords.top}px`,
            bottom: coords.placement === 'top' ? `${window.innerHeight - coords.top}px` : undefined,
            left: `${coords.left}px`,
            width: '310px',
            zIndex: 9999,
          }}
          className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-md text-xs text-slate-700 dark:text-slate-200 pointer-events-auto animate-in fade-in zoom-in-95 duration-150"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          {title && (
            <div className="font-bold text-slate-900 dark:text-white pb-1.5 mb-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[12px]">{title}</span>
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {description && (
            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
              {description}
            </p>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
