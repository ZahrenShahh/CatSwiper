'use client';

import { PanInfo, motion, useAnimation } from 'framer-motion';
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

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isActive) return;

    if (info.offset.x > 100) {
      setExitX(200);
      controls.start({ x: 200, opacity: 0 });
      onSwipe('right');
    } else if (info.offset.x < -100) {
      setExitX(-200);
      controls.start({ x: -200, opacity: 0 });
      onSwipe('left');
    } else {
      controls.start({ x: 0 });
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
      className={`absolute w-[300px] h-[450px] bg-white dark:bg-neutral-800 rounded-xl shadow-xl overflow-hidden cursor-grab ${isActive ? 'z-10' : 'z-0'}`}
      drag="x"
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      animate={controls}
      initial={{ scale: isActive ? 1 : 0.95, opacity: isActive ? 1 : 0.8 }}
      exit={{ x: exitX, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.3 }}
      style={{ touchAction: isActive ? 'pan-y' : 'none' }} // Allow vertical scroll when not active, horizontal drag when active
    >
      <Image src={imageUrl} alt={`Card ${id}`} layout="fill" objectFit="cover" priority={isActive} />
    </motion.div>
  );
};

export default SwipeCard;
