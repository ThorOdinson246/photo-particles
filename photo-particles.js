/**
 * Photo Particle Controller
 * Converts a circular photo into colored particles with springy physics
 */

class PhotoParticle {
    constructor(x, y, radius, color, homeX, homeY) {
        this.x = x;
        this.y = y;
        this.homeX = homeX;
        this.homeY = homeY;
        this.radius = radius;
        this.color = color;
        
        // Physics properties
        this.vx = (Math.random() - 0.5) * 0.2;
        this.vy = (Math.random() - 0.5) * 0.2;
        this.friction = 0.85;
        this.springConstant = 0.025;
        this.maxSpeed = 30;
        this.minDesiredSpeed = 0.01;
        
        // Gentle orbital motion around home position - tighter for image clarity
        this.orbitAngle = Math.random() * Math.PI * 2;
        this.orbitSpeed = 0.2; // Slower orbit
        this.orbitRadius = 0.5 + Math.random() * 1; // Smaller orbit radius to keep particles closer
        this.time = Math.random() * 1000;
    }

    update(allParticles = [], canvasWidth = 0, canvasHeight = 0) {
        this.time += 0.016; // ~60fps
        
        // Calculate gentle orbital target position
        const orbitX = this.homeX + Math.cos(this.orbitAngle) * this.orbitRadius;
        const orbitY = this.homeY + Math.sin(this.orbitAngle) * this.orbitRadius;
        this.orbitAngle += this.orbitSpeed * 0.01;
        
        // Spring force back to orbital position
        const dx = this.x - orbitX;
        const dy = this.y - orbitY;
        
        this.vx += -dx * this.springConstant;
        this.vy += -dy * this.springConstant;
        
        // Reduced particle-to-particle repulsion since particles are larger and fewer
        allParticles.forEach(other => {
            if (other === this) return;
            
            const odx = this.x - other.x;
            const ody = this.y - other.y;
            const distance = Math.sqrt(odx * odx + ody * ody);
            const minDistance = (this.radius + other.radius) * 1.2; // Closer together for image illusion
            
            if (distance < minDistance && distance > 0) {
                const repulseForce = (minDistance - distance) * 0.008; // Moderate repulsion
                const angle = Math.atan2(ody, odx);
                
                this.vx += Math.cos(angle) * repulseForce;
                this.vy += Math.sin(angle) * repulseForce;
            }
        });
        
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Boundary bouncing - particles can move freely in the larger rectangular area
        if (canvasWidth && canvasHeight) {
            const margin = 5; // Smaller margin for more movement freedom
            if (this.x - this.radius < margin) {
                this.x = margin + this.radius;
                this.vx *= -0.8; // Bouncy damping
            }
            if (this.x + this.radius > canvasWidth - margin) {
                this.x = canvasWidth - margin - this.radius;
                this.vx *= -0.8;
            }
            if (this.y - this.radius < margin) {
                this.y = margin + this.radius;
                this.vy *= -0.8;
            }
            if (this.y + this.radius > canvasHeight - margin) {
                this.y = canvasHeight - margin - this.radius;
                this.vy *= -0.8;
            }
        }
        
        // Apply friction
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        // Subtle random motion to prevent stagnation
        const currentSpeed = Math.hypot(this.vx, this.vy);
        if (currentSpeed < this.minDesiredSpeed) {
            this.vx += (Math.random() - 0.5) * 0.001;
            this.vy += (Math.random() - 0.5) * 0.001;
        }
        
        // Speed limit
        if (currentSpeed > this.maxSpeed) {
            this.vx = (this.vx / currentSpeed) * this.maxSpeed;
            this.vy = (this.vy / currentSpeed) * this.maxSpeed;
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

class PhotoParticleController {
    constructor(options = {}) {
        // Default options
        const defaultOptions = {
            containerSelector: '.photo-particles-image',
            imageSrc: 'assets/images/me.jpg',
            touchInfluenceRadius: 120,
            touchMaxForce: 80,
            particleSamplingStep: 2, // Lower is denser
            particleBaseRadius: 1.8,
            particleColor: (r, g, b) => `rgba(${r}, ${g}, ${b}, 0.95)`,
            showToggle: true, // Show toggle controls by default
            // Add any other physics properties from PhotoParticle here if needed
        };

        this.options = { ...defaultOptions, ...options };

        this.imageContainer = document.querySelector(this.options.containerSelector);
        if (!this.imageContainer) {
            console.error(`Container with selector "${this.options.containerSelector}" not found.`);
            return;
        }

        this.imageSrc = this.options.imageSrc;
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.originalImage = null;
        this.imageData = null;
        this.animationId = null;
        
        // Interaction system - only on click/drag
        this.isDragging = false;
        this.touchX = 0;
        this.touchY = 0;
        this.touchForce = 0;
        this.touchMaxForce = this.options.touchMaxForce;
        this.touchForceIncrease = 1.2;
        this.touchForceDecay = 0.88;
        this.touchInfluenceRadius = this.options.touchInfluenceRadius;
        
        // Toggle state
        this.particlesEnabled = true;
        
        this.init();
    }
    
    async init() {
        this.originalImage = this.imageContainer.querySelector('img');
        
        // Create canvas that exactly matches the image position and size
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.style.pointerEvents = 'all';
        this.canvas.style.cursor = 'grab';
        this.canvas.style.borderRadius = '50%'; // Match the circular image
        
        // Position canvas to exactly overlay the image
        this.imageContainer.style.position = 'relative';
        this.imageContainer.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        
        // Get image dimensions and position
        const imageRect = this.originalImage.getBoundingClientRect();
        const containerRect = this.imageContainer.getBoundingClientRect();
        
        // Set canvas size to exactly match the image
        const imageWidth = this.originalImage.offsetWidth;
        const imageHeight = this.originalImage.offsetHeight;
        
        this.canvas.width = imageWidth;
        this.canvas.height = imageHeight;
        this.canvas.style.width = imageWidth + 'px';
        this.canvas.style.height = imageHeight + 'px';
        
        // Position canvas to exactly overlay the image
        this.canvas.style.top = '0px';
        this.canvas.style.left = '0px';
        this.canvas.style.zIndex = '2';
        
        try {
            await this.extractImageColors();
            this.createParticles();
            
            if (this.particles.length > 0) {
                this.originalImage.style.opacity = '0';
                this.setupEventListeners();
                this.setupToggleControls();
                this.animate();
            } else {
                this.canvas.remove();
            }
        } catch (error) {
            this.canvas.remove();
        }
        
        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
    }
    
    handleResize() {
        if (this.canvas && this.originalImage) {
            // Update canvas size to match image
            const imageWidth = this.originalImage.offsetWidth;
            const imageHeight = this.originalImage.offsetHeight;
            
            this.canvas.width = imageWidth;
            this.canvas.height = imageHeight;
            this.canvas.style.width = imageWidth + 'px';
            this.canvas.style.height = imageHeight + 'px';
            
            // Recreate particles with new dimensions
            this.createParticles();
        }
    }
    
    async extractImageColors() {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                
                const size = 120;
                tempCanvas.width = size;
                tempCanvas.height = size;
                
                // Draw circular clipped image
                tempCtx.save();
                tempCtx.beginPath();
                tempCtx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
                tempCtx.clip();
                tempCtx.drawImage(img, 0, 0, size, size);
                tempCtx.restore();
                
                this.imageData = tempCtx.getImageData(0, 0, size, size);
                resolve();
            };
            img.src = this.imageSrc;
        });
    }
    
    createParticles() {
        if (!this.imageData) return;
        
        this.particles = [];
        const data = this.imageData.data;
        const imageSize = 120;
        
        // Canvas now exactly matches image dimensions
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const imageRadius = Math.min(canvasWidth, canvasHeight) / 2;
        
        // Optimized particle count for performance
        const SAMPLING_STEP = this.options.particleSamplingStep;
        const PARTICLE_RETENTION = 1.0;
        
        for (let y = 0; y < imageSize; y += SAMPLING_STEP) {
            for (let x = 0; x < imageSize; x += SAMPLING_STEP) {
                const index = (y * imageSize + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                const a = data[index + 3];
                
                // Skip transparent pixels
                if (a < 50) continue;
                
                // Convert to relative coordinates
                const relativeX = (x - imageSize/2) / (imageSize/2);
                const relativeY = (y - imageSize/2) / (imageSize/2);
                const distance = Math.sqrt(relativeX * relativeX + relativeY * relativeY);
                
                // Only use pixels within circle
                if (distance > 0.95) continue;
                
                // Random retention for particle density control
                if (Math.random() > PARTICLE_RETENTION) continue;
                
                // Calculate world position - perfectly aligned with image
                const worldX = centerX + relativeX * imageRadius;
                const worldY = centerY + relativeY * imageRadius;
                
                // Particle size based on brightness
                const brightness = (r + g + b) / 3;
                const baseRadius = this.options.particleBaseRadius + (brightness / 255) * 2.2;
                const radius = baseRadius * 0.85;
                const color = this.options.particleColor(r, g, b);
                
                const particle = new PhotoParticle(
                    worldX, 
                    worldY, 
                    radius, 
                    color, 
                    worldX, 
                    worldY
                );
                this.particles.push(particle);
            }
        }
    }
    
    setupEventListeners() {
        // Only interact on click/drag, not hover
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.touchX = e.clientX - rect.left;
            this.touchY = e.clientY - rect.top;
            this.isDragging = true;
            this.canvas.style.cursor = 'grabbing';
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.canvas.style.cursor = 'grab';
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const rect = this.canvas.getBoundingClientRect();
                this.touchX = e.clientX - rect.left;
                this.touchY = e.clientY - rect.top;
            }
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.canvas.style.cursor = 'grab';
        });
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            this.touchX = e.touches[0].clientX - rect.left;
            this.touchY = e.touches[0].clientY - rect.top;
            this.isDragging = true;
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', () => {
            this.isDragging = false;
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.isDragging) {
                const rect = this.canvas.getBoundingClientRect();
                this.touchX = e.touches[0].clientX - rect.left;
                this.touchY = e.touches[0].clientY - rect.top;
            }
        }, { passive: false });
    }
    
    setupToggleControls() {
        // Only set up toggle controls if showToggle is enabled
        if (!this.options.showToggle) {
            // Hide toggle elements if they exist
            const toggle = document.getElementById('particleToggle');
            const toggleSwitch = document.getElementById('toggleSwitch');
            const infoLink = document.getElementById('particleInfoLink');
            
            // Also hide labels/text elements
            const toggleLabels = document.querySelectorAll('.toggle-label, label[for="particleToggle"]');
            
            if (toggle) toggle.style.display = 'none';
            if (toggleSwitch) toggleSwitch.style.display = 'none';
            if (infoLink) infoLink.style.display = 'none';
            
            // Hide all toggle-related labels
            toggleLabels.forEach(label => {
                label.style.display = 'none';
            });
            
            // Hide the entire controls container if it only contains toggle elements
            const controls = document.querySelector('.controls');
            if (controls) {
                const visibleChildren = Array.from(controls.children).filter(child => {
                    const computedStyle = window.getComputedStyle(child);
                    return computedStyle.display !== 'none' && 
                           !['particleToggle', 'toggleSwitch', 'particleInfoLink'].includes(child.id) &&
                           !child.classList.contains('toggle-label') &&
                           !(child.tagName === 'LABEL' && child.getAttribute('for') === 'particleToggle');
                });
                if (visibleChildren.length === 0) {
                    controls.style.display = 'none';
                }
            }
            return;
        }
        
        const toggle = document.getElementById('particleToggle');
        const infoLink = document.getElementById('particleInfoLink');
        
        if (toggle) {
            // Enhanced toggle functionality with visual feedback
            toggle.addEventListener('change', (e) => {
                this.particlesEnabled = e.target.checked;
                this.toggleParticles();
                
                // Look for custom toggle switch visual element
                const toggleSwitch = document.getElementById('toggleSwitch');
                if (toggleSwitch) {
                    if (e.target.checked) {
                        toggleSwitch.classList.add('active');
                    } else {
                        toggleSwitch.classList.remove('active');
                    }
                }
            });
            
            // If there's a visual toggle switch, make it clickable
            const toggleSwitch = document.getElementById('toggleSwitch');
            if (toggleSwitch) {
                toggleSwitch.addEventListener('click', () => {
                    toggle.checked = !toggle.checked;
                    toggle.dispatchEvent(new Event('change'));
                });
            }
        }
        
        // Set the GitHub link
        if (infoLink) {
            infoLink.href = 'https://github.com/ThorOdinson246/photo-particles';
            infoLink.setAttribute('data-tooltip', 'View source code');
        }
    }
    
    toggleParticles() {
        if (this.particlesEnabled) {
            // Show particles, hide original image
            this.canvas.style.display = 'block';
            this.originalImage.style.opacity = '0';
            if (!this.animationId) {
                this.animate();
            }
        } else {
            // Hide particles, show original image
            this.canvas.style.display = 'none';
            this.originalImage.style.opacity = '1';
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
        }
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply touch force when dragging
        this.applyTouchForce();
        
        // Update and draw particles with particle-to-particle interaction and boundary bouncing
        this.particles.forEach(particle => {
            particle.update(this.particles, this.canvas.width, this.canvas.height);
            particle.draw(this.ctx);
        });
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    applyTouchForce() {
        // Build up and decay touch force
        if (this.isDragging) {
            this.touchForce = Math.min(this.touchMaxForce, this.touchForce + this.touchForceIncrease);
        } else {
            this.touchForce *= this.touchForceDecay;
        }
        
        // Apply force to particles within influence radius
        if (this.touchForce > 0.1) {
            this.particles.forEach(particle => {
                const dx = particle.x - this.touchX;
                const dy = particle.y - this.touchY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.touchInfluenceRadius && distance > 0) {
                    // Calculate dramatic repulsive force for springy effect
                    const normalizedDistance = distance / this.touchInfluenceRadius;
                    const forceMagnitude = Math.pow(1 - normalizedDistance, 2.5) * this.touchForce;
                    const angle = Math.atan2(dy, dx);
                    
                    // Apply strong springy repulsive force
                    const forceX = Math.cos(angle) * forceMagnitude * 1.2;
                    const forceY = Math.sin(angle) * forceMagnitude * 1.2;
                    
                    particle.vx += forceX;
                    particle.vy += forceY;
                }
            });
        }
    }
    
    // Clean up when needed
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.canvas) {
            this.canvas.remove();
        }
        if (this.originalImage) {
            this.originalImage.style.opacity = '1';
        }
    }
}

// Auto-initialize when page loads
/* document.addEventListener('DOMContentLoaded', () => {
    // All customization can now be done here
    const photoController = new PhotoParticleController({
        imageSrc: 'assets/images/me.jpg',
        touchInfluenceRadius: 150, // Make the interaction area larger
        particleSamplingStep: 3,   // Use fewer particles for a different look
    });
}); */
