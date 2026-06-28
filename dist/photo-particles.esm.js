// photo-particles.js
var PhotoParticle = class {
  constructor(x, y, radius, color, homeX, homeY) {
    this.x = x;
    this.y = y;
    this.homeX = homeX;
    this.homeY = homeY;
    this.radius = radius;
    this.color = color;
    this.vx = (Math.random() - 0.5) * 0.2;
    this.vy = (Math.random() - 0.5) * 0.2;
    this.friction = 0.85;
    this.springConstant = 0.025;
    this.maxSpeed = 30;
    this.minDesiredSpeed = 0.01;
    this.orbitAngle = Math.random() * Math.PI * 2;
    this.orbitSpeed = 0.2;
    this.orbitRadius = 0.5 + Math.random() * 1;
    this.time = Math.random() * 1e3;
  }
  update(allParticles = [], canvasWidth = 0, canvasHeight = 0) {
    this.time += 0.016;
    const orbitX = this.homeX + Math.cos(this.orbitAngle) * this.orbitRadius;
    const orbitY = this.homeY + Math.sin(this.orbitAngle) * this.orbitRadius;
    this.orbitAngle += this.orbitSpeed * 0.01;
    const dx = this.x - orbitX;
    const dy = this.y - orbitY;
    this.vx += -dx * this.springConstant;
    this.vy += -dy * this.springConstant;
    allParticles.forEach((other) => {
      if (other === this)
        return;
      const odx = this.x - other.x;
      const ody = this.y - other.y;
      const distance = Math.sqrt(odx * odx + ody * ody);
      const minDistance = (this.radius + other.radius) * 1.2;
      if (distance < minDistance && distance > 0) {
        const repulseForce = (minDistance - distance) * 8e-3;
        const angle = Math.atan2(ody, odx);
        this.vx += Math.cos(angle) * repulseForce;
        this.vy += Math.sin(angle) * repulseForce;
      }
    });
    this.x += this.vx;
    this.y += this.vy;
    if (canvasWidth && canvasHeight) {
      const margin = 5;
      if (this.x - this.radius < margin) {
        this.x = margin + this.radius;
        this.vx *= -0.8;
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
    this.vx *= this.friction;
    this.vy *= this.friction;
    const currentSpeed = Math.hypot(this.vx, this.vy);
    if (currentSpeed < this.minDesiredSpeed) {
      this.vx += (Math.random() - 0.5) * 1e-3;
      this.vy += (Math.random() - 0.5) * 1e-3;
    }
    if (currentSpeed > this.maxSpeed) {
      this.vx = this.vx / currentSpeed * this.maxSpeed;
      this.vy = this.vy / currentSpeed * this.maxSpeed;
    }
  }
  draw(ctx) {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
};
var PhotoParticleController = class {
  constructor(options = {}) {
    const defaultOptions = {
      containerSelector: ".photo-particles-image",
      imageSrc: "assets/images/me.jpg",
      touchInfluenceRadius: 120,
      touchMaxForce: 80,
      particleSamplingStep: 2,
      // Lower is denser
      particleBaseRadius: 1.8,
      particleColor: (r, g, b) => `rgba(${r}, ${g}, ${b}, 0.95)`,
      showToggle: true
      // Show toggle controls by default
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
    this.isDragging = false;
    this.touchX = 0;
    this.touchY = 0;
    this.touchForce = 0;
    this.touchMaxForce = this.options.touchMaxForce;
    this.touchForceIncrease = 1.2;
    this.touchForceDecay = 0.88;
    this.touchInfluenceRadius = this.options.touchInfluenceRadius;
    this.particlesEnabled = true;
    this.init();
  }
  async init() {
    this.originalImage = this.imageContainer.querySelector("img");
    this.canvas = document.createElement("canvas");
    this.canvas.style.position = "absolute";
    this.canvas.style.pointerEvents = "all";
    this.canvas.style.cursor = "grab";
    this.canvas.style.borderRadius = "50%";
    this.imageContainer.style.position = "relative";
    this.imageContainer.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    const imageRect = this.originalImage.getBoundingClientRect();
    const containerRect = this.imageContainer.getBoundingClientRect();
    const imageWidth = this.originalImage.offsetWidth;
    const imageHeight = this.originalImage.offsetHeight;
    this.canvas.width = imageWidth;
    this.canvas.height = imageHeight;
    this.canvas.style.width = imageWidth + "px";
    this.canvas.style.height = imageHeight + "px";
    this.canvas.style.top = "0px";
    this.canvas.style.left = "0px";
    this.canvas.style.zIndex = "2";
    try {
      await this.extractImageColors();
      this.createParticles();
      if (this.particles.length > 0) {
        this.originalImage.style.opacity = "0";
        this.setupEventListeners();
        this.setupToggleControls();
        this.animate();
      } else {
        this.canvas.remove();
      }
    } catch (error) {
      this.canvas.remove();
    }
    window.addEventListener("resize", () => this.handleResize());
  }
  handleResize() {
    if (this.canvas && this.originalImage) {
      const imageWidth = this.originalImage.offsetWidth;
      const imageHeight = this.originalImage.offsetHeight;
      this.canvas.width = imageWidth;
      this.canvas.height = imageHeight;
      this.canvas.style.width = imageWidth + "px";
      this.canvas.style.height = imageHeight + "px";
      this.createParticles();
    }
  }
  async extractImageColors() {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");
        const size = 120;
        tempCanvas.width = size;
        tempCanvas.height = size;
        tempCtx.save();
        tempCtx.beginPath();
        tempCtx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
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
    if (!this.imageData)
      return;
    this.particles = [];
    const data = this.imageData.data;
    const imageSize = 120;
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const imageRadius = Math.min(canvasWidth, canvasHeight) / 2;
    const SAMPLING_STEP = this.options.particleSamplingStep;
    const PARTICLE_RETENTION = 1;
    for (let y = 0; y < imageSize; y += SAMPLING_STEP) {
      for (let x = 0; x < imageSize; x += SAMPLING_STEP) {
        const index = (y * imageSize + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const a = data[index + 3];
        if (a < 50)
          continue;
        const relativeX = (x - imageSize / 2) / (imageSize / 2);
        const relativeY = (y - imageSize / 2) / (imageSize / 2);
        const distance = Math.sqrt(relativeX * relativeX + relativeY * relativeY);
        if (distance > 0.95)
          continue;
        if (Math.random() > PARTICLE_RETENTION)
          continue;
        const worldX = centerX + relativeX * imageRadius;
        const worldY = centerY + relativeY * imageRadius;
        const brightness = (r + g + b) / 3;
        const baseRadius = this.options.particleBaseRadius + brightness / 255 * 2.2;
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
    this.canvas.addEventListener("mousedown", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.touchX = e.clientX - rect.left;
      this.touchY = e.clientY - rect.top;
      this.isDragging = true;
      this.canvas.style.cursor = "grabbing";
    });
    this.canvas.addEventListener("mouseup", () => {
      this.isDragging = false;
      this.canvas.style.cursor = "grab";
    });
    this.canvas.addEventListener("mousemove", (e) => {
      if (this.isDragging) {
        const rect = this.canvas.getBoundingClientRect();
        this.touchX = e.clientX - rect.left;
        this.touchY = e.clientY - rect.top;
      }
    });
    this.canvas.addEventListener("mouseleave", () => {
      this.isDragging = false;
      this.canvas.style.cursor = "grab";
    });
    this.canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      this.touchX = e.touches[0].clientX - rect.left;
      this.touchY = e.touches[0].clientY - rect.top;
      this.isDragging = true;
    }, { passive: false });
    this.canvas.addEventListener("touchend", () => {
      this.isDragging = false;
    });
    this.canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
      if (this.isDragging) {
        const rect = this.canvas.getBoundingClientRect();
        this.touchX = e.touches[0].clientX - rect.left;
        this.touchY = e.touches[0].clientY - rect.top;
      }
    }, { passive: false });
  }
  setupToggleControls() {
    if (!this.options.showToggle) {
      const toggle2 = document.getElementById("particleToggle");
      const toggleSwitch = document.getElementById("toggleSwitch");
      const infoLink2 = document.getElementById("particleInfoLink");
      const toggleLabels = document.querySelectorAll('.toggle-label, label[for="particleToggle"]');
      if (toggle2)
        toggle2.style.display = "none";
      if (toggleSwitch)
        toggleSwitch.style.display = "none";
      if (infoLink2)
        infoLink2.style.display = "none";
      toggleLabels.forEach((label) => {
        label.style.display = "none";
      });
      const controls = document.querySelector(".controls");
      if (controls) {
        const visibleChildren = Array.from(controls.children).filter((child) => {
          const computedStyle = window.getComputedStyle(child);
          return computedStyle.display !== "none" && !["particleToggle", "toggleSwitch", "particleInfoLink"].includes(child.id) && !child.classList.contains("toggle-label") && !(child.tagName === "LABEL" && child.getAttribute("for") === "particleToggle");
        });
        if (visibleChildren.length === 0) {
          controls.style.display = "none";
        }
      }
      return;
    }
    const toggle = document.getElementById("particleToggle");
    const infoLink = document.getElementById("particleInfoLink");
    if (toggle) {
      toggle.addEventListener("change", (e) => {
        this.particlesEnabled = e.target.checked;
        this.toggleParticles();
        const toggleSwitch2 = document.getElementById("toggleSwitch");
        if (toggleSwitch2) {
          if (e.target.checked) {
            toggleSwitch2.classList.add("active");
          } else {
            toggleSwitch2.classList.remove("active");
          }
        }
      });
      const toggleSwitch = document.getElementById("toggleSwitch");
      if (toggleSwitch) {
        toggleSwitch.addEventListener("click", () => {
          toggle.checked = !toggle.checked;
          toggle.dispatchEvent(new Event("change"));
        });
      }
    }
    if (infoLink) {
      infoLink.href = "https://github.com/ThorOdinson246/photo-particles";
      infoLink.setAttribute("data-tooltip", "View source code");
    }
  }
  toggleParticles() {
    if (this.particlesEnabled) {
      this.canvas.style.display = "block";
      this.originalImage.style.opacity = "0";
      if (!this.animationId) {
        this.animate();
      }
    } else {
      this.canvas.style.display = "none";
      this.originalImage.style.opacity = "1";
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
    }
  }
  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.applyTouchForce();
    this.particles.forEach((particle) => {
      particle.update(this.particles, this.canvas.width, this.canvas.height);
      particle.draw(this.ctx);
    });
    this.animationId = requestAnimationFrame(() => this.animate());
  }
  applyTouchForce() {
    if (this.isDragging) {
      this.touchForce = Math.min(this.touchMaxForce, this.touchForce + this.touchForceIncrease);
    } else {
      this.touchForce *= this.touchForceDecay;
    }
    if (this.touchForce > 0.1) {
      this.particles.forEach((particle) => {
        const dx = particle.x - this.touchX;
        const dy = particle.y - this.touchY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < this.touchInfluenceRadius && distance > 0) {
          const normalizedDistance = distance / this.touchInfluenceRadius;
          const forceMagnitude = Math.pow(1 - normalizedDistance, 2.5) * this.touchForce;
          const angle = Math.atan2(dy, dx);
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
      this.originalImage.style.opacity = "1";
    }
  }
};
export {
  PhotoParticle,
  PhotoParticleController
};
