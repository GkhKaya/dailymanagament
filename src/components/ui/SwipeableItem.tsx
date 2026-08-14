"use client";

import React, { useState, useRef, ReactNode } from "react";
import { Trash2 } from "lucide-react";

interface SwipeableItemProps {
  children: ReactNode;
  onDelete: () => Promise<void> | void;
  onClick?: () => void;
  disabled?: boolean;
  confirmDeleteText?: string;
}

export function SwipeableItem({
  children,
  onDelete,
  onClick,
  disabled = false,
  confirmDeleteText = "Sil",
}: SwipeableItemProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isHorizontalRef = useRef<boolean | null>(null);
  const hasSwipedRef = useRef(false);

  const MAX_SWIPE = -80; // Distance to reveal delete button
  const AUTO_DELETE_THRESHOLD = -180; // Distance to auto-trigger delete

  const triggerVibration = () => {
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isDeleting) return;
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    isHorizontalRef.current = null;
    hasSwipedRef.current = false;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || isDeleting || !isSwiping) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - startXRef.current;
    const diffY = currentY - startYRef.current;

    // Determine direction on first significant movement
    if (isHorizontalRef.current === null) {
      if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
        isHorizontalRef.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    // Only swipe horizontally
    if (isHorizontalRef.current) {
      // Base offset depending on whether already open
      const baseOffset = isOpen ? MAX_SWIPE : 0;
      let newTranslateX = baseOffset + diffX;

      // Restrict range (can't swipe right past 0, can swipe left up to -200)
      if (newTranslateX > 0) {
        newTranslateX = 0;
      } else if (newTranslateX < AUTO_DELETE_THRESHOLD - 30) {
        newTranslateX = AUTO_DELETE_THRESHOLD - 30;
      }

      if (Math.abs(diffX) > 5) {
        hasSwipedRef.current = true;
      }

      setTranslateX(newTranslateX);
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || isDeleting || !isSwiping) return;
    setIsSwiping(false);

    if (translateX < AUTO_DELETE_THRESHOLD) {
      // Auto trigger delete on full swipe
      triggerVibration();
      executeDelete();
    } else if (translateX < MAX_SWIPE / 2) {
      // Snap open
      if (!isOpen) triggerVibration();
      setTranslateX(MAX_SWIPE);
      setIsOpen(true);
    } else {
      // Snap closed
      setTranslateX(0);
      setIsOpen(false);
    }
  };

  const executeDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } catch (err) {
      console.error("Delete error:", err);
      setIsDeleting(false);
      setTranslateX(0);
      setIsOpen(false);
    }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (hasSwipedRef.current || isOpen) {
      e.stopPropagation();
      e.preventDefault();
      // If open, tapping anywhere on the item closes it
      if (isOpen) {
        setTranslateX(0);
        setIsOpen(false);
      }
      return;
    }

    if (onClick) {
      onClick();
    }
  };

  return (
    <div className="relative overflow-hidden w-full rounded-xl touch-pan-y select-none">
      {/* Red Delete Background Action */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-end bg-red-600/90 text-white px-5 rounded-r-xl cursor-pointer transition-opacity duration-200"
        style={{
          width: "100%",
          opacity: translateX < 0 ? 1 : 0,
        }}
        onClick={(e) => {
          e.stopPropagation();
          triggerVibration();
          executeDelete();
        }}
      >
        <div className="flex items-center gap-1.5 font-bold text-xs pr-2">
          <Trash2 size={18} className="animate-pulse" />
          <span>{isDeleting ? "Siliniyor..." : confirmDeleteText}</span>
        </div>
      </div>

      {/* Main Content Row */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleContainerClick}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isSwiping ? "none" : "transform 0.25s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.25s ease",
          opacity: isDeleting ? 0 : 1,
        }}
        className="relative z-10 w-full bg-inherit"
      >
        {children}
      </div>
    </div>
  );
}
