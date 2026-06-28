export interface PhotoParticleOptions {
    containerSelector?: string;
    imageSrc?: string;
    touchInfluenceRadius?: number;
    touchMaxForce?: number;
    particleSamplingStep?: number;
    particleBaseRadius?: number;
    particleColor?: (r: number, g: number, b: number) => string;
    showToggle?: boolean;
}

export class PhotoParticle {
    x: number;
    y: number;
    homeX: number;
    homeY: number;
    radius: number;
    color: string;
    vx: number;
    vy: number;
    friction: number;
    springConstant: number;
    maxSpeed: number;
    minDesiredSpeed: number;
    orbitAngle: number;
    orbitSpeed: number;
    orbitRadius: number;
    time: number;

    constructor(x: number, y: number, radius: number, color: string, homeX: number, homeY: number);
    update(allParticles?: PhotoParticle[], canvasWidth?: number, canvasHeight?: number): void;
    draw(ctx: CanvasRenderingContext2D): void;
}

export class PhotoParticleController {
    options: Required<PhotoParticleOptions>;
    imageContainer: Element | null;
    imageSrc: string;
    canvas: HTMLCanvasElement | null;
    ctx: CanvasRenderingContext2D | null;
    particles: PhotoParticle[];
    originalImage: HTMLImageElement | null;
    imageData: ImageData | null;
    animationId: number | null;
    isDragging: boolean;
    touchX: number;
    touchY: number;
    touchForce: number;
    touchMaxForce: number;

    constructor(options?: PhotoParticleOptions);
}
