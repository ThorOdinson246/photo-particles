# Photo Particle Effect

A standalone JavaScript script that transforms a designated image on your webpage into an interactive particle cloud.

## Features

- **Configurable**: Easily customize the look and feel through an options object.
- **Plug and Play**: Automatically finds and replaces the target image.
- **Interactive**: Particles scatter when you click and drag your mouse over them.

- **Responsive**: Adjusts the particle canvas and layout for both desktop and mobile views.
- **Physics-Based Animation**: Particles have properties like friction, springiness, and gentle orbital motion, creating a dynamic and organic feel.

## Performance

_New in 1.1.0._

Each particle is integrated from its own state — spring-to-home, orbital drift, and drag force — with no per-frame neighbor scan, so the physics step is **O(n)** and dense images hold 60fps. The animation loop also pauses automatically while the image is scrolled out of view and resumes on return.

Per-frame physics cost (isolated, before canvas drawing):

| Particles | Before | After  |
| --------- | ------ | ------ |
| 1,000     | 4.4 ms | 0.11 ms |
| 2,000     | 16.7 ms | 0.18 ms |
| 3,000     | 36.5 ms | 0.28 ms |

At 2,000 particles the old per-frame cost alone capped the frame rate at 60fps before anything was drawn; the update is now ~90× cheaper. Absolute numbers are machine-dependent; the scaling is not.

## Installation

You can install `photo-particles` via npm:

```bash
npm install photo-particles
```

Or you can use it directly in the browser via a CDN like unpkg:

```html
<script src="https://unpkg.com/photo-particles/dist/photo-particles.min.js"></script>
```

## Usage

### 1. Set Up Your HTML Structure

    The script needs a container element to hold the particle canvas. By default, it looks for an element with the class `.photo-particles-image`, but you can customize this.

    ```html
    <!-- The script will find this container by default -->
    <div class="photo-particles-image">
        <!-- The script automatically finds the first img tag inside the container -->
        <img src="path/to/your/image.jpg" alt="A description of the image">
    </div>
    ```

### 2. Initialize the Script

#### Option A: Using ES Modules (npm / Webpack / Vite)

If you installed via npm, you can import the controller and use it in your JavaScript:

```javascript
import { PhotoParticleController } from 'photo-particles';

document.addEventListener('DOMContentLoaded', () => {
    const photoController = new PhotoParticleController({
        containerSelector: '.photo-particles-image',
        imageSrc: 'path/to/your/image.jpg',
        touchInfluenceRadius: 150,
    });
});
```

#### Option B: Using a Script Tag

If you included the script tag directly, the library is available on the global `PhotoParticles` object:

```html
<script>
    document.addEventListener('DOMContentLoaded', () => {
        const photoController = new PhotoParticles.PhotoParticleController({
            containerSelector: '.photo-particles-image',
            imageSrc: 'path/to/your/image.jpg',
            touchInfluenceRadius: 150,
        });
    });
</script>
```

4.  **Toggle Controls**

    The script provides built-in toggle functionality with multiple configuration options.

    ### Basic Toggle Setup

    ```html
    <!-- Simple checkbox toggle -->
    <input type="checkbox" id="particleToggle" checked>
    <label for="particleToggle">Enable Particles</label>
    ```

    ### Advanced Toggle with Custom Styling

    ```html
    <div class="controls">
        <label for="particleToggle" class="toggle-label">Particles</label>
        <input type="checkbox" id="particleToggle" checked>
        <div class="toggle-switch active" id="toggleSwitch"></div>
        <a href="#" class="info-button" id="particleInfoLink">i</a>
    </div>
    ```

    ### Toggle Configuration Options

    **Show Toggle (Default)**
    ```javascript
    const photoController = new PhotoParticleController({
        imageSrc: 'path/to/your/image.jpg',
        showToggle: true  // Default: shows all toggle elements
    });
    ```

    **Hide Toggle Completely**
    ```javascript
    const photoController = new PhotoParticleController({
        imageSrc: 'path/to/your/image.jpg',
        showToggle: false  // Hides all toggle elements and labels
    });
    ```

    ### Automatic Element Detection

    When `showToggle: true`, the library automatically detects and manages:
    - `#particleToggle` - Main toggle checkbox
    - `#toggleSwitch` - Visual toggle switch element
    - `#particleInfoLink` - Info/GitHub link button
    - `.toggle-label` - Toggle label text
    - `label[for="particleToggle"]` - Associated label elements

    When `showToggle: false`, all these elements are automatically hidden.
## Demo

![Demo](https://raw.githubusercontent.com/ThorOdinson246/photo-particles/main/demo.gif)

## Configuration Options

You can pass an options object to the `PhotoParticleController` to customize the effect.

### Built-in Toggle System

The library includes a comprehensive toggle system that automatically:

- **Detects HTML elements** with specific IDs
- **Binds event listeners** for toggle functionality  
- **Manages visual states** for custom toggle switches
- **Handles GitHub link** integration automatically
- **Provides complete control** over visibility via `showToggle` option

#### Toggle Elements

| Element ID | Purpose | Auto-detected | Description |
|------------|---------|---------------|-------------|
| `particleToggle` | Main checkbox | ✅ | Primary toggle control |
| `toggleSwitch` | Visual toggle | ✅ | Custom styled toggle switch |
| `particleInfoLink` | Info button | ✅ | Links to GitHub repository |
| `.toggle-label` | Label text | ✅ | Text labels for toggle |

#### Toggle Behavior

- **Automatic binding**: No JavaScript code required
- **Visual feedback**: Custom toggle switches update automatically
- **State management**: Particle effect enabled/disabled based on checkbox
- **Smart hiding**: All related elements hidden when `showToggle: false`

#### CSS Customization

Toggle elements are fully customizable with CSS. Target these selectors:

```css
/* Toggle checkbox (usually hidden) */
#particleToggle { }

/* Toggle switch visual element */
#toggleSwitch {
    /* Custom toggle switch styling */
    background: your-color;
    border-radius: your-radius;
}

#toggleSwitch.active {
    /* Active state styling */
    background: your-active-color;
}

/* Toggle labels */
.toggle-label,
label[for="particleToggle"] {
    /* Label text styling */
    color: your-text-color;
    font-size: your-size;
}

/* Info button */
#particleInfoLink {
    /* Info button styling */
    background: your-button-color;
}

/* Controls container */
.controls {
    /* Container styling */
    background: your-background;
    padding: your-padding;
}
```

The library only manages functionality - all visual styling is controlled by your CSS.

### Options Table

| Option                 | Type     | Default                         | Description                                                                 |
| ---------------------- | -------- | ------------------------------- | --------------------------------------------------------------------------- |
| `containerSelector`    | String   | `'.photo-particles-image'`      | The CSS selector for the container that holds the image.                    |
| `imageSrc`             | String   | `'assets/images/me.jpg'`          | The path to the image you want to convert into particles.                   |
| `touchInfluenceRadius` | Number   | `120`                           | The radius of the mouse interaction area in pixels.                         |
| `touchMaxForce`        | Number   | `80`                            | The maximum strength of the force pushing particles away from the mouse.    |
| `particleSamplingStep` | Number   | `2`                             | The spacing between particles. A higher number means fewer, less dense particles. |
| `particleBaseRadius`   | Number   | `1.8`                           | The base size of each particle. Size also varies slightly by brightness.    |
| `particleColor`        | Function | `(r,g,b) => ...`                | A function that returns a CSS color string. Receives `r`, `g`, `b` values.  |
| `showToggle`           | Boolean  | `true`                          | Whether to show the toggle controls. Set to `false` to hide all toggle elements. |
| `overflowPadding`      | Number   | `100`                           | The amount of padding (in pixels) added around the canvas to allow particles to flow beyond the circular image boundaries. |


## Notes

-   **CORS Policy**: If you are loading the image from a different domain, you may encounter CORS (Cross-Origin Resource Sharing) issues, as the script needs to read the image's pixel data. It's best to serve the image from the same domain as your website.

## Changelog

### 1.1.0

- Physics update is now **O(n)** — the per-frame particle-to-particle neighbor scan is gone, so the update is ~90× cheaper at 2,000 particles and dense images hold 60fps.
- The animation loop pauses while the image is scrolled out of view and resumes on return.
- `destroy()` now also releases the resize listener and IntersectionObserver.

## License

This project is free to use and modify. Feel free to adapt it for your own portfolio or website.
