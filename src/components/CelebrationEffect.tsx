import React, { useEffect, useState, useCallback, useMemo } from 'react';

interface CelebrationEffectProps {
  isVisible: boolean;
  onComplete?: () => void;
  intensity?: 'low' | 'medium' | 'high';
}

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  size: number;
  shape: 'square' | 'circle' | 'triangle';
  opacity: number;
}

interface EmojiParticle {
  id: number;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  emoji: string;
  rotation: number;
  scale: number;
  opacity: number;
}

const CelebrationEffect: React.FC<CelebrationEffectProps> = ({ 
  isVisible, 
  onComplete, 
  intensity = 'medium' 
}) => {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [emojiParticles, setEmojiParticles] = useState<EmojiParticle[]>([]);

  const confettiColors = useMemo(() => [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', 
    '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'
  ], []);
  
  const emojis = useMemo(() => ['🎉', '🎊', '⭐', '✨', '🌟', '💫', '🎆', '🎇'], []);
  
  const getParticleCount = useCallback(() => {
    switch (intensity) {
      case 'low': return { confetti: 50, emojis: 8 };
      case 'medium': return { confetti: 80, emojis: 12 };
      case 'high': return { confetti: 120, emojis: 16 };
      default: return { confetti: 80, emojis: 12 };
    }
  }, [intensity]);

  useEffect(() => {
    if (isVisible) {
      const counts = getParticleCount();
      
      // Create confetti pieces
      const newConfetti = Array.from({ length: counts.confetti }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        velocityX: (Math.random() - 0.5) * 8,
        velocityY: Math.random() * 3 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        size: Math.random() * 8 + 4,
        shape: ['square', 'circle', 'triangle'][Math.floor(Math.random() * 3)] as 'square' | 'circle' | 'triangle',
        opacity: 1
      }));

      // Create emoji particles
      const newEmojiParticles = Array.from({ length: counts.emojis }, (_, i) => ({
        id: i + counts.confetti,
        x: 20 + Math.random() * 60,
        y: 20 + Math.random() * 30,
        velocityX: (Math.random() - 0.5) * 6,
        velocityY: Math.random() * -8 - 4,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        rotation: 0,
        scale: 0.8 + Math.random() * 0.6,
        opacity: 1
      }));

      setConfetti(newConfetti);
      setEmojiParticles(newEmojiParticles);

      // Animation loop
      const animationInterval = setInterval(() => {
        setConfetti(prevConfetti => 
          prevConfetti.map(piece => ({
            ...piece,
            x: piece.x + piece.velocityX * 0.5,
            y: piece.y + piece.velocityY * 0.5,
            velocityY: piece.velocityY + 0.2, // gravity
            rotation: piece.rotation + piece.rotationSpeed,
            opacity: piece.y > 110 ? Math.max(0, piece.opacity - 0.02) : piece.opacity
          })).filter(piece => piece.opacity > 0.01 && piece.y < 150)
        );

        setEmojiParticles(prevEmojis =>
          prevEmojis.map(particle => ({
            ...particle,
            x: particle.x + particle.velocityX * 0.3,
            y: particle.y + particle.velocityY * 0.3,
            velocityY: particle.velocityY + 0.15, // gravity
            rotation: particle.rotation + 2,
            opacity: particle.y > 110 ? Math.max(0, particle.opacity - 0.015) : particle.opacity
          })).filter(particle => particle.opacity > 0.01 && particle.y < 150)
        );
      }, 50);

      const completeTimer = setTimeout(() => {
        clearInterval(animationInterval);
        setConfetti([]);
        setEmojiParticles([]);
        if (onComplete) onComplete();
      }, 5000);

      return () => {
        clearInterval(animationInterval);
        clearTimeout(completeTimer);
      };
    } else {
      setConfetti([]);
      setEmojiParticles([]);
    }
  }, [isVisible, intensity, onComplete, emojis, confettiColors, getParticleCount]);

  if (!isVisible) return null;

  const renderConfettiPiece = (piece: ConfettiPiece) => {
    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${piece.x}%`,
      top: `${piece.y}%`,
      width: `${piece.size}px`,
      height: `${piece.size}px`,
      backgroundColor: piece.color,
      opacity: piece.opacity,
      transform: `rotate(${piece.rotation}deg)`,
      transition: 'none',
      pointerEvents: 'none'
    };

    switch (piece.shape) {
      case 'circle':
        style.borderRadius = '50%';
        break;
      case 'triangle':
        style.width = '0';
        style.height = '0';
        style.backgroundColor = 'transparent';
        style.borderLeft = `${piece.size / 2}px solid transparent`;
        style.borderRight = `${piece.size / 2}px solid transparent`;
        style.borderBottom = `${piece.size}px solid ${piece.color}`;
        break;
      default: // square
        break;
    }

    return <div key={piece.id} style={style} />;
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Gradient background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-green-400/10 to-blue-400/10 animate-pulse" />
      
      {/* Confetti pieces */}
      {confetti.map(renderConfettiPiece)}
      
      {/* Emoji particles */}
      {emojiParticles.map((particle) => (
        <div
          key={particle.id}
          className="absolute text-2xl sm:text-3xl md:text-4xl"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
            opacity: particle.opacity,
            transition: 'none',
            pointerEvents: 'none'
          }}
        >
          {particle.emoji}
        </div>
      ))}

      {/* Central burst effect */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          {/* Expanding rings with staggered animation */}
          <div className="absolute inset-0 animate-ping">
            <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-gradient-to-r from-yellow-400/30 to-orange-400/30 rounded-full"></div>
          </div>
          <div className="absolute inset-0 animate-ping" style={{ animationDelay: '0.2s' }}>
            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-gradient-to-r from-green-400/30 to-blue-400/30 rounded-full"></div>
          </div>
          <div className="absolute inset-0 animate-ping" style={{ animationDelay: '0.4s' }}>
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-r from-purple-400/30 to-pink-400/30 rounded-full"></div>
          </div>
          
          {/* Center celebration icon with enhanced animation */}
          <div className="relative z-10 w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 flex items-center justify-center">
            <div className="text-4xl sm:text-5xl md:text-7xl animate-bounce" style={{ animationDuration: '1s' }}>
              🎉
            </div>
          </div>
        </div>
      </div>

      {/* Success message with enhanced styling */}
      <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-4">
        <div className="bg-white/95 backdrop-blur-md rounded-xl px-6 sm:px-8 md:px-10 py-4 md:py-6 shadow-2xl border-4 border-gradient-to-r from-green-400 to-blue-400 animate-bounce max-w-sm sm:max-w-md border-green-400">
          <div className="text-center">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
              🎊 Excellent! 🎊
            </div>
            <div className="text-green-700 text-sm sm:text-base font-medium">Query executed successfully!</div>
          </div>
        </div>
      </div>

      {/* Corner celebration elements */}
      <div className="absolute top-20 left-10 animate-bounce text-3xl sm:text-4xl" style={{ animationDelay: '0.3s', animationDuration: '1.5s' }}>
        🎆
      </div>
      <div className="absolute top-32 right-10 animate-bounce text-3xl sm:text-4xl" style={{ animationDelay: '0.6s', animationDuration: '1.8s' }}>
        🎇
      </div>
      <div className="absolute bottom-20 left-20 animate-bounce text-3xl sm:text-4xl" style={{ animationDelay: '0.9s', animationDuration: '1.2s' }}>
        ✨
      </div>
      <div className="absolute bottom-32 right-20 animate-bounce text-3xl sm:text-4xl" style={{ animationDelay: '1.2s', animationDuration: '1.6s' }}>
        🌟
      </div>

      {/* Floating achievement badges */}
      <div className="absolute top-1/3 left-1/5 animate-float">
        <div className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-4 py-2 rounded-full text-sm font-bold shadow-xl border-2 border-green-300">
          Perfect! ✅
        </div>
      </div>
      <div className="absolute top-2/3 right-1/5 animate-float" style={{ animationDelay: '0.5s' }}>
        <div className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 px-4 py-2 rounded-full text-sm font-bold shadow-xl border-2 border-blue-300">
          Amazing! 🏆
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-10px) rotate(1deg); }
          50% { transform: translateY(-20px) rotate(0deg); }
          75% { transform: translateY(-10px) rotate(-1deg); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default CelebrationEffect;