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
        
        // Create canvas that covers a larger rectangular area around the image
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.style.pointerEvents = 'all';
        // Lower z-index on mobile to ensure toggle button works
        this.canvas.style.zIndex = window.innerWidth <= 900 ? '1' : '2';
        this.canvas.style.cursor = 'grab';
        
        // Find the featured-image container to position canvas there
        const featuredImageDiv = document.querySelector('.featured-image');
        if (!featuredImageDiv) return;
        
        // Make featured-image position relative and append canvas there
        featuredImageDiv.style.position = 'relative';
        featuredImageDiv.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas to cover the entire featured-image area with responsive expansion
        const rect = featuredImageDiv.getBoundingClientRect();
        
        // Check if we're in mobile column layout
        const isMobile = window.innerWidth <= 900; // Match CSS breakpoint
        const isVerySmall = window.innerWidth <= 400;
        
        let expandedWidth, expandedHeight;
        
        if (isMobile) {
            // In mobile column layout, extend canvas dramatically
            // Horizontal: Full screen width for maximum particle movement
            // Vertical: Use more of viewport height to let particles move behind nav and below image
            expandedWidth = window.innerWidth; // Full screen width
            expandedHeight = window.innerHeight * 0.9; // 90% of viewport height for more vertical space
        } else {
            // Desktop row layout - extend more for better particle movement
            expandedWidth = rect.width * 1.5; // 50% expansion horizontal
            expandedHeight = window.innerHeight * 0.7; // 70% of viewport height for more vertical movement
        }
        
        this.canvas.width = expandedWidth;
        this.canvas.height = expandedHeight;
        this.canvas.style.width = expandedWidth + 'px';  
        this.canvas.style.height = expandedHeight + 'px';
        
        // Position canvas to allow particles to move behind elements
        if (isMobile) {
            // Center horizontally on full screen width, position to allow movement behind nav and text
            const offsetX = (expandedWidth - rect.width) / -2;
            const offsetY = -window.innerHeight * 0.15; // Move canvas up to allow particles behind nav
            this.canvas.style.top = offsetY + 'px';
            this.canvas.style.left = offsetX + 'px';
            
            // On mobile, reduce canvas height to avoid covering the toggle button
            const toggleSpace = 100; // Space for toggle button
            this.canvas.height = Math.max(expandedHeight - toggleSpace, rect.height);
            this.canvas.style.height = this.canvas.height + 'px';
        } else {
            // Desktop - center the expanded canvas within the featured-image area
            const offsetX = (expandedWidth - rect.width) / -2;
            const offsetY = -window.innerHeight * 0.1; // Move up more for vertical particle movement
            this.canvas.style.top = offsetY + 'px';
            this.canvas.style.left = offsetX + 'px';
        }
        
        // Set lower z-index so particles go behind other elements but remain interactive
        this.canvas.style.zIndex = '2'; // Above image but below UI elements
        
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
        const featuredImageDiv = document.querySelector('.featured-image');
        if (featuredImageDiv && this.canvas) {
            const rect = featuredImageDiv.getBoundingClientRect();
            
            // Check if we're in mobile column layout
            const isMobile = window.innerWidth <= 900; // Match CSS breakpoint
            
            let expandedWidth, expandedHeight;
            
            if (isMobile) {
                // In mobile column layout, extend canvas dramatically
                expandedWidth = window.innerWidth; // Full screen width
                expandedHeight = window.innerHeight * 0.9; // 90% of viewport height
            } else {
                // Desktop row layout - extend more for better particle movement
                expandedWidth = rect.width * 1.5; // 50% expansion horizontal
                expandedHeight = window.innerHeight * 0.7; // 70% of viewport height
            }
            
            this.canvas.width = expandedWidth;
            this.canvas.height = expandedHeight;
            this.canvas.style.width = expandedWidth + 'px';
            this.canvas.style.height = expandedHeight + 'px';
            
            // Position canvas appropriately
            if (isMobile) {
                // Center horizontally on full screen width, position to allow movement behind nav and text
                const offsetX = (expandedWidth - rect.width) / -2;
                const offsetY = -window.innerHeight * 0.15; // Move canvas up to allow particles behind nav
                this.canvas.style.top = offsetY + 'px';
                this.canvas.style.left = offsetX + 'px';
                
                // On mobile, reduce canvas height to avoid covering the toggle button
                const toggleSpace = 100; // Space for toggle button
                this.canvas.height = Math.max(expandedHeight - toggleSpace, rect.height);
                this.canvas.style.height = this.canvas.height + 'px';
            } else {
                // Desktop - center the expanded canvas with more vertical movement
                const offsetX = (expandedWidth - rect.width) / -2;
                const offsetY = -window.innerHeight * 0.1; // Move up more for vertical particle movement
                this.canvas.style.top = offsetY + 'px';
                this.canvas.style.left = offsetX + 'px';
            }
            
            // Update z-index based on screen size to ensure toggle button works on mobile
            this.canvas.style.zIndex = window.innerWidth <= 900 ? '1' : '2';
            
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
        
        // Get the actual image position within the larger canvas area
        const imageRect = this.originalImage.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        
        // Calculate image center relative to the larger canvas
        const centerX = imageRect.left - canvasRect.left + imageRect.width / 2;
        const centerY = imageRect.top - canvasRect.top + imageRect.height / 2;
        
        // Image radius based on actual image size
        const imageRadius = Math.min(imageRect.width, imageRect.height) / 2;
        
        // Optimized particle count for performance - fewer particles but closer together
        const SAMPLING_STEP = this.options.particleSamplingStep; // Sample every 2nd pixel for better performance and quality balance
        const PARTICLE_RETENTION = 1.0; // Keep all valid particles for best image quality
        
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
                
                // Calculate world position - align perfectly with original image
                const worldX = centerX + relativeX * imageRadius;
                const worldY = centerY + relativeY * imageRadius;
                
                // Larger particles that are closer together for better image illusion
                const brightness = (r + g + b) / 3;
                const baseRadius = this.options.particleBaseRadius + (brightness / 255) * 2.2; // Larger base size
                const radius = baseRadius * 0.85; // Slightly smaller but not too small
                const color = this.options.particleColor(r, g, b);
                
                // No random offset - keep particles in precise positions for better image quality
                const offsetX = 0;
                const offsetY = 0;
                
                const particle = new PhotoParticle(
                    worldX + offsetX, 
                    worldY + offsetY, 
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
        const toggle = document.getElementById('particleToggle');
        const infoLink = document.getElementById('particleInfoLink');
        
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                this.particlesEnabled = e.target.checked;
                this.toggleParticles();
            });
        }
        
        // Set the GitHub link (you can update this URL when you create the repo)
        if (infoLink) {
            infoLink.href = 'https://github.com/yourusername/photo-particle-system'; // Update this URL
            infoLink.setAttribute('data-tooltip', 'Here\'s how I did this');
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
