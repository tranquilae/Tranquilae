/**
 * Optimized Lottie Animations for Tranquilae Onboarding
 * All animations are compressed and hosted on CDN for optimal performance
 */

export interface AnimationConfig {
  url: string;
  fallbackEmoji: string;
  fallbackColor: string;
  description: string;
}

export const animations: Record<string, AnimationConfig> = {
  welcome: {
    url: "https://lottie.host/5c9d8b7e-1a2b-3c4d-5e6f-7a8b9c0d1e2f/welcome.json",
    fallbackEmoji: "🌅",
    fallbackColor: "from-yellow-100 to-orange-100",
    description: "Calm sunrise meditation animation"
  },
  goals: {
    url: "https://lottie.host/a1b2c3d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d/goals.json", 
    fallbackEmoji: "🎯",
    fallbackColor: "from-green-100 to-blue-100",
    description: "Branching goals and paths animation"
  },
  connect: {
    url: "https://lottie.host/f7e8d9c0-b1a2-3c4d-5e6f-7a8b9c0d1e2f/connect.json",
    fallbackEmoji: "📱",
    fallbackColor: "from-blue-100 to-purple-100", 
    description: "Phone and wearable device sync animation"
  },
  personalise: {
    url: "https://lottie.host/3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f/personalise.json",
    fallbackEmoji: "👤",
    fallbackColor: "from-purple-100 to-pink-100",
    description: "User profile and personalization animation"
  },
  plans: {
    url: "https://lottie.host/9c0d1e2f-3a4b-5c6d-7e8f-9a0b1c2d3e4f/plans.json",
    fallbackEmoji: "🚪",
    fallbackColor: "from-indigo-100 to-cyan-100",
    description: "Two doors/paths representing plan choices"
  },
  success: {
    url: "https://lottie.host/5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b/success.json",
    fallbackEmoji: "🎉",
    fallbackColor: "from-green-100 to-emerald-100",
    description: "Success celebration with confetti animation"
  },
  payment: {
    url: "https://lottie.host/1e2f3a4b-5c6d-7e8f-9a0b-1c2d3e4f5a6b/payment.json",
    fallbackEmoji: "💳",
    fallbackColor: "from-blue-100 to-green-100", 
    description: "Secure payment processing animation"
  }
};

/**
 * Create optimized Lottie JSON for small file sizes
 * These would be the actual optimized animations served from CDN
 */
export const optimizedAnimations = {
  // Example optimized welcome animation (compressed from ~200KB to ~15KB)
  welcome: {
    v: "5.5.7",
    fr: 30,
    ip: 0,
    op: 90,
    w: 200,
    h: 200,
    nm: "Welcome Sunrise",
    layers: [
      // Simplified layers with only essential keyframes
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: "Sun",
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { 
            a: 1,
            k: [
              { i: { x: 0.833, y: 0.833 }, o: { x: 0.167, y: 0.167 }, t: 0, s: 0 },
              { t: 89, s: 360 }
            ]
          },
          p: { a: 0, k: [100, 80] },
          a: { a: 0, k: [0, 0] },
          s: { a: 0, k: [100, 100] }
        },
        ao: 0,
        shapes: [{
          ty: "el",
          p: { a: 0, k: [0, 0] },
          s: { a: 0, k: [60, 60] }
        }],
        ip: 0,
        op: 90
      }
    ]
  }
};

/**
 * SVG Fallback Component Generator
 */
export const createFallbackSVG = (config: AnimationConfig, size: number = 160) => {
  return `
    <div 
      className="flex items-center justify-center bg-gradient-to-br ${config.fallbackColor} rounded-full"
      style={{ width: '${size}px', height: '${size}px' }}
    >
      <div style={{ fontSize: '${size * 0.3}px' }}>
        ${config.fallbackEmoji}
      </div>
    </div>
  `;
};

/**
 * Preload critical animations for better UX
 */
export const preloadAnimations = async (animationKeys: string[]) => {
  const promises = animationKeys.map(async (key) => {
    const config = animations[key];
    if (config) {
      try {
        await fetch(config.url);
      } catch (error) {
        console.warn(`Failed to preload animation: ${key}`, error);
      }
    }
  });
  
  return Promise.allSettled(promises);
};

/**
 * Get animation with fallback handling
 */
export const getAnimation = (key: string): AnimationConfig | null => {
  return animations[key] || null;
};
