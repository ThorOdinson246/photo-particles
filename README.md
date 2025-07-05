# Photo Particle Effect

A standalone JavaScript script that transforms a designated image on your webpage into an interactive particle cloud.

## Features

- **Configurable**: Easily customize the look and feel through an options object.
- **Plug and Play**: Automatically finds and replaces the target image.
- **Interactive**: Particles scatter when you click and drag your mouse over them.

- **Responsive**: Adjusts the particle canvas and layout for both desktop and mobile views.
- **Physics-Based Animation**: Particles have properties like friction, springiness, and gentle orbital motion, creating a dynamic and organic feel.

## How to Use

This script is designed to be easy to drop into an existing project.

1.  **Add the Script to Your Project**

    Place the `photo-particles.js` file somewhere in your project, for example, in an `assets/js/` directory.

2.  **Set Up Your HTML Structure**

    The script needs a container element to hold the particle canvas. By default, it looks for an element with the class `.photo-particles-image`, but you can customize this.

    ```html
    <!-- The script will find this container by default -->
    <div class="photo-particles-image">
        <!-- The script automatically finds the first img tag inside the container -->
        <img src="path/to/your/image.jpg" alt="A description of the image">
    </div>
    ```

3.  **Include and Initialize the Script**

    Add a `<script>` tag to your HTML file to include `photo-particles.js`. In a second script tag, create a new instance of `PhotoParticleController` and pass in your desired options.

    It's best to place these at the end of your `<body>`.

    ```html
    <script src="assets/js/photo-particles.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            // Initialize the controller with custom options
            const photoController = new PhotoParticleController({
                // You can override the default container selector if needed
                // containerSelector: '.your-custom-class',
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

![Demo](demo.gif)

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


## Notes

-   **CORS Policy**: If you are loading the image from a different domain, you may encounter CORS (Cross-Origin Resource Sharing) issues, as the script needs to read the image's pixel data. It's best to serve the image from the same domain as your website.

## License

This project is free to use and modify. Feel free to adapt it for your own portfolio or website.
