import React, { useEffect, useState, useCallback, useMemo } from 'react';

interface CelebrationEffectProps {
  isVisible: boolean;
  onComplete?: () => void;
  intensity?: 'low' | 'medium' | 'high';
}

const CelebrationEffect: React.FC<CelebrationEffectProps> = ({ 
  isVisible, 
  onComplete, 
  intensity = 'medium' 
}) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; emoji: string; delay: number }>>([]);

  const emojis = useMemo(() => ['🎉', '🎊', '✨', '🌟', '🎆', '💫', '🔥', '⭐', '🎁', '🏆'], []);
  
  const getParticleCount = useCallback(() => {
    switch (intensity) {
      case 'low': return 15;
      case 'medium': return 25;
      case 'high': return 40;
      default: return 25;
    }
  }, [intensity]);

  useEffect(() => {
    if (isVisible) {
      const particleCount = getParticleCount();
      const newParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        delay: Math.random() * 800
      }));
      
      setParticles(newParticles);

      // Start fade out animation after 4 seconds, complete at 5 seconds
      const fadeTimer = setTimeout(() => {
        setParticles([]);
      }, 4000);

      const completeTimer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 5000);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(completeTimer);
      };
    } else {
      setParticles([]);
    }
  }, [isVisible, intensity, onComplete, emojis, getParticleCount]);

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 pointer-events-none z-50 overflow-hidden transition-opacity duration-1000 ${particles.length === 0 ? 'opacity-0' : 'opacity-100'}`}>
      {/* Background celebration overlay - better colors */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-400/15 via-blue-400/15 to-yellow-400/15 animate-pulse transition-opacity duration-1000" />
      
      {/* Particle effects */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute text-lg sm:text-xl md:text-2xl animate-bounce transition-all duration-500"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}ms`,
            animationDuration: '2.5s',
          }}
        >
          <div className="animate-spin transition-transform duration-500" style={{ animationDuration: '2s' }}>
            {particle.emoji}
          </div>
        </div>
      ))}

      {/* Central burst effect */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          {/* Expanding rings */}
          <div className="absolute inset-0 animate-ping">
            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-green-400/40 rounded-full"></div>
          </div>
          <div className="absolute inset-0 animate-ping" style={{ animationDelay: '0.3s' }}>
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-blue-400/40 rounded-full"></div>
          </div>
          <div className="absolute inset-0 animate-ping" style={{ animationDelay: '0.6s' }}>
            <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-yellow-400/40 rounded-full"></div>
          </div>
          
          {/* Center celebration icon */}
          <div className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 flex items-center justify-center">
            <div className="text-3xl sm:text-4xl md:text-6xl animate-bounce">🎉</div>
          </div>
        </div>
      </div>

      {/* Success message */}
      <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 sm:px-6 md:px-8 py-3 md:py-4 shadow-2xl border-2 sm:border-4 border-green-400 animate-bounce max-w-xs sm:max-w-sm">
          <div className="text-center">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 mb-1">Excellent! 🎊</div>
            <div className="text-green-700 text-xs sm:text-sm">Query executed successfully!</div>
          </div>
        </div>
      </div>

      {/* Side fireworks - responsive */}
      <div className="absolute top-16 sm:top-20 left-4 sm:left-10 animate-bounce" style={{ animationDelay: '0.5s' }}>
        <div className="text-2xl sm:text-3xl md:text-4xl">🎆</div>
      </div>
      <div className="absolute top-24 sm:top-32 right-4 sm:right-10 animate-bounce" style={{ animationDelay: '0.8s' }}>
        <div className="text-2xl sm:text-3xl md:text-4xl">🎇</div>
      </div>
      <div className="absolute bottom-16 sm:bottom-20 left-8 sm:left-20 animate-bounce" style={{ animationDelay: '1.2s' }}>
        <div className="text-2xl sm:text-3xl md:text-4xl">✨</div>
      </div>
      <div className="absolute bottom-24 sm:bottom-32 right-8 sm:right-20 animate-bounce" style={{ animationDelay: '1.5s' }}>
        <div className="text-2xl sm:text-3xl md:text-4xl">🌟</div>
      </div>

      {/* Floating success badges - responsive */}
      <div className="absolute top-1/4 left-1/4 animate-float">
        <div className="bg-green-100 text-green-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium shadow-lg">
          Correct! ✅
        </div>
      </div>
      <div className="absolute top-3/4 right-1/4 animate-float" style={{ animationDelay: '0.7s' }}>
        <div className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium shadow-lg">
          Well Done! 🏆
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default CelebrationEffect;