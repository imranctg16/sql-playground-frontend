import React, { useEffect, useState } from 'react';

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

  const emojis = ['🎉', '🎊', '✨', '🌟', '🎆', '💫', '🔥', '⭐', '🎁', '🏆'];
  
  const getParticleCount = () => {
    switch (intensity) {
      case 'low': return 15;
      case 'medium': return 25;
      case 'high': return 40;
      default: return 25;
    }
  };

  useEffect(() => {
    if (isVisible) {
      const particleCount = getParticleCount();
      const newParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        delay: Math.random() * 1000
      }));
      
      setParticles(newParticles);

      // Auto-hide after animation
      const timer = setTimeout(() => {
        setParticles([]);
        if (onComplete) onComplete();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, intensity, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Background celebration overlay - better colors */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-blue-400/20 to-yellow-400/20 animate-pulse" />
      
      {/* Particle effects */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute text-2xl animate-bounce"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}ms`,
            animationDuration: '2s',
          }}
        >
          <div className="animate-spin" style={{ animationDuration: '1.5s' }}>
            {particle.emoji}
          </div>
        </div>
      ))}

      {/* Central burst effect */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          {/* Expanding rings */}
          <div className="absolute inset-0 animate-ping">
            <div className="w-32 h-32 bg-green-400/40 rounded-full"></div>
          </div>
          <div className="absolute inset-0 animate-ping" style={{ animationDelay: '0.3s' }}>
            <div className="w-24 h-24 bg-blue-400/40 rounded-full"></div>
          </div>
          <div className="absolute inset-0 animate-ping" style={{ animationDelay: '0.6s' }}>
            <div className="w-16 h-16 bg-yellow-400/40 rounded-full"></div>
          </div>
          
          {/* Center celebration icon */}
          <div className="relative z-10 w-32 h-32 flex items-center justify-center">
            <div className="text-6xl animate-bounce">🎉</div>
          </div>
        </div>
      </div>

      {/* Success message */}
      <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg px-8 py-4 shadow-2xl border-4 border-green-400 animate-bounce">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">Excellent! 🎊</div>
            <div className="text-green-700 text-sm">Query executed successfully!</div>
          </div>
        </div>
      </div>

      {/* Side fireworks */}
      <div className="absolute top-20 left-10 animate-bounce" style={{ animationDelay: '0.5s' }}>
        <div className="text-4xl">🎆</div>
      </div>
      <div className="absolute top-32 right-10 animate-bounce" style={{ animationDelay: '0.8s' }}>
        <div className="text-4xl">🎇</div>
      </div>
      <div className="absolute bottom-20 left-20 animate-bounce" style={{ animationDelay: '1.2s' }}>
        <div className="text-4xl">✨</div>
      </div>
      <div className="absolute bottom-32 right-20 animate-bounce" style={{ animationDelay: '1.5s' }}>
        <div className="text-4xl">🌟</div>
      </div>

      {/* Floating success badges */}
      <div className="absolute top-1/4 left-1/4 animate-float">
        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
          Correct! ✅
        </div>
      </div>
      <div className="absolute top-3/4 right-1/4 animate-float" style={{ animationDelay: '0.7s' }}>
        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
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