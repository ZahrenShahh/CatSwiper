'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import SwipeCard from '../components/SwipeCard';
import { Heart, X, Loader2, RefreshCw } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const CATAAS_URL = 'https://cataas.com';
const NUM_CATS_TO_FETCH = 10;

interface CatData {
  id: string; // Changed from _id
  mimetype: string;
  tags: string[];
  createdAt: string; // Added from schema
  imageUrl: string; // We'll construct this
}

export default function Home() {
  const [cards, setCards] = useState<CatData[]>([]);
  const [likedCats, setLikedCats] = useState<CatData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [allCardsSwiped, setAllCardsSwiped] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchCats = useCallback(async () => {
    setIsLoading(true);
    setAllCardsSwiped(false);
    setLikedCats([]);
    setCurrentIndex(0);
    setCards([]); // Clear previous cards
    setFetchError(null);
    let fetchedCats: CatData[] = [];

    try {
      const response = await fetch(`${CATAAS_URL}/api/cats?limit=${NUM_CATS_TO_FETCH}&skip=0&timestamp=${Date.now()}`); // Added skip=0 and timestamp
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to fetch cats from /api/cats: ${response.status}`, errorText);
        setFetchError(`Failed to fetch cats (Status: ${response.status}). The API might be down or rate limiting. Please try again later.`);
        setCards([]);
      } else {
        const catsFromApi = await response.json();
        if (Array.isArray(catsFromApi)) {
          // Assuming the response is an array of objects, each with at least an _id
          // And that /api/cats already provides unique enough cats for a single batch
          fetchedCats = catsFromApi.slice(0, NUM_CATS_TO_FETCH).map((cat: any) => ({
            id: cat.id || cat._id, // Prefer cat.id, fallback to cat._id for safety
            mimetype: cat.mimetype || 'image/jpeg',
            tags: cat.tags || [],
            createdAt: cat.createdAt || new Date().toISOString(), // Add createdAt, provide default
            imageUrl: `${CATAAS_URL}/cat/${cat.id || cat._id}` // Construct image URL using id or _id
          }));
          
          // Filter out any cats that might be missing an id after mapping
          fetchedCats = fetchedCats.filter(cat => cat.id);

          if (fetchedCats.length < NUM_CATS_TO_FETCH && catsFromApi.length < NUM_CATS_TO_FETCH) {
             console.warn(`API returned only ${fetchedCats.length} cats, requested ${NUM_CATS_TO_FETCH}.`);
          }
          if (fetchedCats.length === 0 && NUM_CATS_TO_FETCH > 0) {
            setFetchError('API returned no cats. Please try again later.');
          }
        } else {
          console.error('Failed to parse cats response: Expected an array.', catsFromApi);
          setFetchError('Received an unexpected response from the cat API.');
        }
        setCards(fetchedCats);
      }
    } catch (error) {
      console.error('Critical error fetching cats:', error);
      setFetchError('An unexpected error occurred while fetching cats.');
      setCards([]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCats();
  }, [fetchCats]);

  const activeCard = useMemo(() => cards[currentIndex], [cards, currentIndex]);
  const nextCard = useMemo(() => cards[currentIndex + 1], [cards, currentIndex]);

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (!activeCard) return;

    if (direction === 'right') {
      setLikedCats(prev => [...prev, activeCard]);
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= cards.length) {
      setAllCardsSwiped(true);
    }
    // Delay setting current index to allow card to animate out
    setTimeout(() => {
        setCurrentIndex(nextIndex);
    }, 300); // Should match animation duration

  }, [activeCard, cards.length, currentIndex]);

  const triggerSwipe = (direction: 'left' | 'right') => {
    if (activeCard) {
      // This is a conceptual trigger. The actual animation is handled by SwipeCard's drag.
      // For button clicks, we directly call handleSwipe and rely on AnimatePresence for exit.
      // To make buttons truly *trigger* a swipe animation on the card itself,
      // SwipeCard would need to expose animation controls, e.g., via useImperativeHandle.
      // For simplicity, we'll just advance the state.
      handleSwipe(direction);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-100 dark:bg-neutral-900 p-4 font-[family-name:var(--font-geist-sans)]">
        <Loader2 size={64} className="animate-spin text-pink-500" />
        <p className="mt-4 text-neutral-600 dark:text-neutral-400">Fetching cute cats...</p>
        {fetchError && <p className="mt-4 text-red-500">Error: {fetchError}</p>}
      </div>
    );
  }

  if (allCardsSwiped) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-100 dark:bg-neutral-900 p-4 font-[family-name:var(--font-geist-sans)]">
        <h1 className="text-3xl font-bold text-neutral-800 dark:text-neutral-200 mb-6 text-center">Swipe Summary</h1>
        <p className="text-xl text-neutral-700 dark:text-neutral-300 mb-8">
          You liked {likedCats.length} out of {cards.length} cats!
        </p>
        {likedCats.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-700 dark:text-neutral-300 mb-4">Your Liked Cats:</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-4xl">
              {likedCats.map(cat => (
                <div key={cat.id} className="rounded-lg overflow-hidden shadow-lg aspect-square">
                  <Image src={cat.imageUrl} alt={`Liked cat ${cat.id}`} width={200} height={200} className="object-cover w-full h-full" />
                </div>
              ))}
            </div>
          </div>
        )}
        <button
          onClick={fetchCats} // Re-fetch cats
          className="flex items-center justify-center gap-2 px-6 py-3 bg-pink-500 text-white font-semibold rounded-full shadow-md hover:bg-pink-600 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-75"
        >
          <RefreshCw size={20} />
          Swipe More Cats!
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-100 dark:bg-neutral-900 p-4 font-[family-name:var(--font-geist-sans)] overflow-hidden">
      <h1 className="text-4xl font-bold text-neutral-800 dark:text-neutral-200 mb-8 fixed top-8 sm:top-12 z-20 bg-neutral-100/80 dark:bg-neutral-900/80 px-4 py-2 rounded-lg">Cat Swiper</h1>
      <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 mt-20">Swipe or click the button</h2>
      <h3 className="text-xs text-neutral-800 dark:text-neutral-200 mt-2">By Zahren</h3>
      <div className=" w-full max-w-xs aspect-[3/4] rounded-xl overflow-hidden shadow-xl mt-4 sm:mt-8 mb-8 flex items-center justify-center">
        <AnimatePresence initial={false}>
          {activeCard && (
            <SwipeCard
              key={activeCard.id} 
              id={activeCard.id}
              imageUrl={activeCard.imageUrl}
              onSwipe={handleSwipe}
              isActive={true}
            />
          )}
          {nextCard && (
             <SwipeCard
              key={nextCard.id}
              id={nextCard.id}
              imageUrl={nextCard.imageUrl}
              onSwipe={() => {}} 
              isActive={false} 
            />
          )}
        </AnimatePresence>
        {!activeCard && !isLoading && !allCardsSwiped && !fetchError && (
            <p className="text-neutral-500 dark:text-neutral-400">No more cats to show right now. Try again later?</p>
        )}
        {fetchError && !isLoading && (
             <div className="text-center">
                <p className="text-red-500 dark:text-red-400 mb-4">{fetchError}</p>
                <button
                    onClick={fetchCats}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-pink-500 text-white font-semibold rounded-full shadow-md hover:bg-pink-600 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-75"
                >
                    <RefreshCw size={20} />
                    Try Again
                </button>
            </div>
        )}
      </div>

      <div className="flex gap-6 sm:gap-8 fixed bottom-8 sm:bottom-12 z-20">
        <button
          onClick={() => triggerSwipe('left')}
          className="p-4 bg-white dark:bg-neutral-700 rounded-full shadow-xl hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-all transform hover:scale-110 disabled:opacity-50 disabled:transform-none"
          disabled={!activeCard || isLoading}
          aria-label="Reject"
        >
          <X size={32} className="text-red-500" />
        </button>
        <button
          onClick={() => triggerSwipe('right')}
          className="p-4 bg-white dark:bg-neutral-700 rounded-full shadow-xl hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-all transform hover:scale-110 disabled:opacity-50 disabled:transform-none"
          disabled={!activeCard || isLoading}
          aria-label="Accept"
        >
          <Heart size={32} className="text-green-500" fill="currentColor" />
        </button>
      </div>
    </div>
  );
}

