import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Mountain,
  Palmtree,
  Building2,
  TreePine,
  Sparkles,
  CameraOff,
  Compass,
  Utensils,
  ShoppingBag,
  HeartHandshake
} from 'lucide-react';

interface DestinationImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackCategory?: string;
  fallbackText?: string;
  showVerifiedBadge?: boolean;
  aspectRatio?: string;
  onClick?: () => void;
}

/**
 * Normalizes Wikimedia URLs, fixing legacy or broken domain names and query parameters.
 */
export function normalizeImageUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  let clean = url.trim();
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) return null;

  // Fix non-existent thumb.wikimedia.org to upload.wikimedia.org
  if (clean.includes('thumb.wikimedia.org')) {
    clean = clean.replace('thumb.wikimedia.org', 'upload.wikimedia.org');
  }

  // Remove tracking query parameters that break thumbnail caching
  if (clean.includes('upload.wikimedia.org') && clean.includes('?')) {
    clean = clean.split('?')[0];
  }

  return clean;
}

/**
 * Returns a tailored icon and thematic gradient based on destination/activity category
 */
function getCategoryFallback(category?: string, name?: string) {
  const text = `${category || ''} ${name || ''}`.toLowerCase();

  if (
    text.includes('mountain') ||
    text.includes('snow') ||
    text.includes('peak') ||
    text.includes('hill') ||
    text.includes('manali') ||
    text.includes('ooty') ||
    text.includes('munnar') ||
    text.includes('kedarnath') ||
    text.includes('badrinath')
  ) {
    return {
      icon: Mountain,
      gradient: 'from-[#0B1224] via-[#1E3A8A] to-[#3984F5]',
      accent: '#3984F5',
      label: 'Alpine Sanctuary'
    };
  }

  if (
    text.includes('beach') ||
    text.includes('sea') ||
    text.includes('coast') ||
    text.includes('goa') ||
    text.includes('vizag') ||
    text.includes('visakhapatnam') ||
    text.includes('puducherry') ||
    text.includes('alappuzha') ||
    text.includes('maldives') ||
    text.includes('bali')
  ) {
    return {
      icon: Palmtree,
      gradient: 'from-[#0F172A] via-[#0284C7] to-[#38BDF8]',
      accent: '#60A5FA',
      label: 'Coastal Haven'
    };
  }

  if (
    text.includes('temple') ||
    text.includes('pilgrimage') ||
    text.includes('sacred') ||
    text.includes('tirupati') ||
    text.includes('shirdi') ||
    text.includes('bhadrachalam') ||
    text.includes('puri') ||
    text.includes('nashik')
  ) {
    return {
      icon: Landmark,
      gradient: 'from-[#1E1B4B] via-[#4338CA] to-[#818CF8]',
      accent: '#F472B6',
      label: 'Sacred Heritage'
    };
  }

  if (
    text.includes('palace') ||
    text.includes('fort') ||
    text.includes('heritage') ||
    text.includes('history') ||
    text.includes('hyderabad') ||
    text.includes('jaipur') ||
    text.includes('agra') ||
    text.includes('mysuru') ||
    text.includes('delhi')
  ) {
    return {
      icon: Landmark,
      gradient: 'from-[#2E1065] via-[#7E22CE] to-[#F472B6]',
      accent: '#F472B6',
      label: 'Royal Heritage'
    };
  }

  if (
    text.includes('food') ||
    text.includes('dining') ||
    text.includes('cafe') ||
    text.includes('cuisine') ||
    text.includes('bistro')
  ) {
    return {
      icon: Utensils,
      gradient: 'from-[#451A03] via-[#B45309] to-[#FACC15]',
      accent: '#FACC15',
      label: 'Culinary Journey'
    };
  }

  if (text.includes('shopping') || text.includes('market') || text.includes('bazaar')) {
    return {
      icon: ShoppingBag,
      gradient: 'from-[#500724] via-[#BE185D] to-[#F472B6]',
      accent: '#F472B6',
      label: 'Bazaar & Crafts'
    };
  }

  if (text.includes('nature') || text.includes('park') || text.includes('garden') || text.includes('forest')) {
    return {
      icon: TreePine,
      gradient: 'from-[#064E3B] via-[#047857] to-[#34D399]',
      accent: '#3984F5',
      label: 'Nature & Trails'
    };
  }

  // Default City / Metropolis
  return {
    icon: Building2,
    gradient: 'from-[#0B1224] via-[#1E293B] to-[#3984F5]',
    accent: '#3984F5',
    label: 'Explore Destination'
  };
}

export const DestinationImage: React.FC<DestinationImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackCategory,
  fallbackText,
  showVerifiedBadge = false,
  aspectRatio,
  onClick
}) => {
  const [normalizedUrl, setNormalizedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const clean = normalizeImageUrl(src);
    setNormalizedUrl(clean);
    setIsLoading(Boolean(clean));
    setHasError(!clean);
  }, [src]);

  const fallback = getCategoryFallback(fallbackCategory, alt || fallbackText);
  const FallbackIcon = fallback.icon;

  const handleImageError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden ${aspectRatio || 'w-full h-full'} flex items-center justify-center select-none`}
    >
      {/* Skeleton Pulse Loading Shimmer */}
      {isLoading && normalizedUrl && !hasError && (
        <div className="absolute inset-0 bg-[#DCE6F5] dark:bg-[#192640] animate-pulse z-10 flex items-center justify-center">
          <Compass className="w-6 h-6 text-[#3984F5] dark:text-[#60A5FA] animate-spin" style={{ animationDuration: '3s' }} />
        </div>
      )}

      {/* Main Photograph */}
      {normalizedUrl && !hasError ? (
        <img
          src={normalizedUrl}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={handleImageError}
          onLoad={handleImageLoad}
          className={`${className} transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        />
      ) : (
        /* Polished Thematic Vector Artwork Fallback */
        <div
          className={`w-full h-full min-h-[120px] bg-gradient-to-br ${fallback.gradient} p-4 flex flex-col items-center justify-center text-center relative overflow-hidden`}
        >
          {/* Subtle Decorative Background Rings */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-white/5 blur-xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-white/5 blur-xl pointer-events-none" />

          {/* Central Category Icon */}
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white mb-2 shadow-lg">
            <FallbackIcon className="w-5 h-5 text-white drop-shadow-sm" />
          </div>

          {/* Destination / Activity Title */}
          <span className="text-xs font-bold text-white tracking-wide line-clamp-1 max-w-[90%] drop-shadow-sm">
            {fallbackText || alt}
          </span>

          {/* Thematic Category Pill */}
          <span className="mt-1 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-[10px] text-white/90 font-medium border border-white/20">
            {fallback.label}
          </span>
        </div>
      )}

      {/* Optional Verified Authentic Badge */}
      {showVerifiedBadge && !hasError && !isLoading && (
        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#121D33]/85 backdrop-blur-md border border-white/20 text-[9px] font-bold text-[#60A5FA] flex items-center gap-1 shadow-md z-10 pointer-events-none">
          <Sparkles className="w-2.5 h-2.5 text-[#FACC15]" />
          <span>Verified Photo</span>
        </span>
      )}
    </div>
  );
};

export default DestinationImage;
