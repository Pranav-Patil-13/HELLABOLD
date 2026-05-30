export const triggerConfettiBurst = (element) => {
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const count = 35;
  const colors = ['#ed3000', '#38a169', '#3182ce', '#ecc94b', '#9f7aea', '#ed64a6', '#4fd1c5'];

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'confetti-particle';
    
    // Random color
    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Position randomly spread across the element's bounding box
    const startX = rect.left + Math.random() * rect.width;
    const startY = rect.top + Math.random() * rect.height;
    particle.style.left = `${startX}px`;
    particle.style.top = `${startY}px`;
    
    // Random angles and velocities (slower speed)
    const angle = Math.random() * Math.PI * 2;
    const velocity = 3 + Math.random() * 6;
    const xVelocity = Math.cos(angle) * velocity;
    const yVelocity = Math.sin(angle) * velocity;
    
    particle.style.setProperty('--dx', `${xVelocity * 20}px`);
    particle.style.setProperty('--dy', `${yVelocity * 20}px`);
    particle.style.setProperty('--rot', `${-180 + Math.random() * 360}deg`);
    
    // Random sizes and shapes
    const size = 5 + Math.random() * 7;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    if (Math.random() > 0.5) {
      particle.style.borderRadius = '50%';
    }
    
    document.body.appendChild(particle);
    
    // Cleanup (increased duration)
    setTimeout(() => {
      particle.remove();
    }, 1600);
  }
};
