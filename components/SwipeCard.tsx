'use client';

import { PanInfo, motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface CardProps {
  id: string; // Changed from number to string
  imageUrl: string;
  onSwipe: (direction: 'left' | 'right') => void;
  isActive: boolean;
}

const SwipeCard = ({ id, imageUrl, onSwipe, isActive }: CardProps) => {
  const controls = useAnimation();
  const [exitX, setExitX] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);

  // Motion values for drag position and rotation
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]); // Rotate up to 15 degrees

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isActive) return;

    if (info.offset.x > 100) {
      setExitX(300); // Increased exit distance
      setDirection('right');
      controls.start({
        x: 300,
        opacity: 0,
        rotate: 20, // Rotate on exit
        scale: 0.95,
        transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] }
      });
      onSwipe('right');
    } else if (info.offset.x < -100) {
      setExitX(-300); // Increased exit distance
      setDirection('left');
      controls.start({
        x: -300,
        opacity: 0,
        rotate: -20, // Rotate on exit
        scale: 0.95,
        transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] }
      });
      onSwipe('left');
    } else {
      setDirection(null);
      controls.start({
        x: 0,
        rotate: 0,
        transition: { type: 'spring', stiffness: 500, damping: 30 }
      });
    }
  };

  // Update rotation based on drag position
  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isActive) return;
    x.set(info.offset.x);
    // Show like/nope indicator during drag
    if (info.offset.x > 30) {
      setDirection('right');
    } else if (info.offset.x < -30) {
      setDirection('left');
    } else {
      setDirection(null);
    }
  };

  useEffect(() => {
    if (!isActive) {
      controls.start({ 
        scale: 0.95,
        opacity: 0.8,
        transition: { duration: 0.2 }
      });
    } else {
      controls.start({ 
        scale: 1,
        opacity: 1,
        x: 0, // Reset x position when becoming active
        transition: { duration: 0.2 }
      });
    }
  }, [isActive, controls]);

  return (
    <motion.div
      className={`absolute w-[300px] h-[450px] bg-white dark:bg-neutral-800 rounded-xl shadow-xl overflow-hidden cursor-grab ${isActive ? 'z-10' : 'z-0'} border-4 border-blue-500`} // Added temporary blue border
      drag={isActive ? "x" : false} // Only allow drag for the active card
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDrag={handleDrag} // Add onDrag handler
      onDragEnd={handleDragEnd}
      animate={controls}
      initial={{ scale: isActive ? 1 : 0.95, opacity: isActive ? 1 : 0.8, x: 0, rotate: 0 }}
      exit={{ x: exitX, opacity: 0, rotate: exitX > 0 ? 20 : -20 }} // Add rotation to exit animation
      style={{
        touchAction: isActive ? 'pan-y' : 'none',
        rotate, // Apply dynamic rotation
        x // Apply dynamic x offset from drag
      }}
    >
      {/* Like indicator */}
      <motion.div
        className="absolute top-8 right-8 bg-green-500 text-white font-bold px-4 py-2 rounded-lg shadow-lg transform rotate-12 text-2xl pointer-events-none"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: direction === 'right' ? 1 : 0, scale: direction === 'right' ? 1 : 0.5 }}
        transition={{ duration: 0.2 }}
      >
        LIKE
      </motion.div>

      {/* Nope indicator */}
      <motion.div
        className="absolute top-8 left-8 bg-red-500 text-white font-bold px-4 py-2 rounded-lg shadow-lg transform -rotate-12 text-2xl pointer-events-none"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: direction === 'left' ? 1 : 0, scale: direction === 'left' ? 1 : 0.5 }}
        transition={{ duration: 0.2 }}
      >
        NOPE
      </motion.div>

      <Image src={imageUrl} alt={`Card ${id}`} layout="fill" objectFit="cover" priority={isActive} />
    </motion.div>
  );
};

export default SwipeCard;
