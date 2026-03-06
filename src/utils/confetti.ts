import confetti from 'canvas-confetti';

export function celebrateCompletion() {
  const duration = 1500;
  const end = Date.now() + duration;
  const defaults = {
    startVelocity: 30,
    spread: 360,
    ticks: 60,
    zIndex: 9999,
    scalar: 0.8,
  };

  const frame = () => {
    confetti({
      ...defaults,
      particleCount: 50,
      origin: { x: Math.random(), y: Math.random() * 0.5 + 0.1 },
    });
    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}
