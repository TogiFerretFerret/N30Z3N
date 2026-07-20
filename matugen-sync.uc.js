// matugen-sync.uc.js — Live wallpaper color sync for Zen Browser
// Watches ~/.cache/matugen-zen-color and directly overrides all Neo variables
(function() {
  const WATCH_FILE = "/home/river/.cache/matugen-zen-color";
  let lastColor = "";
  let interval = null;

  function applyColor(color) {
    const root = document.documentElement;
    const body = document.body;

    // Override zen's primary
    root.style.setProperty("--zen-primary-color", color);
    root.style.setProperty("--zen-colors-primary", color);
    root.style.setProperty("--zen-colors-border", `color-mix(in srgb, ${color} 40%, transparent)`);

    // Override all NeoZen derived variables directly on root and body
    const targets = [root];
    if (body) targets.push(body);

    for (let target of targets) {
      target.style.setProperty("--Neo-Accent", `color-mix(in srgb, ${color} 80%, white)`);
      target.style.setProperty("--Neo-Color-Default", `color-mix(in srgb, color-mix(in srgb, ${color} 5%, var(--Neo-Background)), transparent)`);
      target.style.setProperty("--Neo-Color-Hover", `color-mix(in srgb, color-mix(in srgb, ${color} 15%, var(--Neo-Background)), transparent 10%)`);
      target.style.setProperty("--Neo-Color-Selected", `color-mix(in srgb, color-mix(in srgb, ${color} 10%, var(--Neo-Background)) 80%, transparent 20%)`);
      target.style.setProperty("--Neo-Glow-1", `color-mix(in srgb, ${color} 90%, white)`);
      target.style.setProperty("--Neo-Glow-2", `color-mix(in srgb, ${color} 80%, white)`);
      target.style.setProperty("--Neo-Glow-3", `color-mix(in srgb, ${color} 70%, white)`);
      target.style.setProperty("--Neo-Glow-Filter-1", `drop-shadow(0px 0px 4px ${color})`);
      target.style.setProperty("--Neo-Glow-Filter-2", `drop-shadow(0px 0px 6px ${color})`);
      target.style.setProperty("--Neo-Glow-Filter-3", `drop-shadow(0px 0px 8px ${color})`);
      target.style.setProperty("--Neo-Blur-Color", `color-mix(in srgb, ${color} 2%, var(--Neo-Background) 63%)`);

      // Legacy root variables
      target.style.setProperty("--Neo-Color-Dark", `color-mix(in srgb, ${color} 10%, #000000c0)`);
      target.style.setProperty("--Neo-Color-Light", `color-mix(in srgb, ${color} 25%, white)`);
      target.style.setProperty("--Neo-Glow-Color-1", `color-mix(in srgb, ${color} 90%, white)`);
      target.style.setProperty("--Neo-Glow-Color-2", `color-mix(in srgb, ${color} 80%, white)`);
      target.style.setProperty("--Neo-Glow-Color-3", `color-mix(in srgb, ${color} 70%, white)`);
    }

    // Hit all browser windows
    for (let win of Services.wm.getEnumerator("navigator:browser")) {
      if (win !== window) {
        const otherRoot = win.document.documentElement;
        otherRoot.style.setProperty("--zen-primary-color", color);
        otherRoot.style.setProperty("--zen-colors-primary", color);
        otherRoot.style.setProperty("--zen-colors-border", `color-mix(in srgb, ${color} 40%, transparent)`);
        otherRoot.style.setProperty("--Neo-Accent", `color-mix(in srgb, ${color} 80%, white)`);
        otherRoot.style.setProperty("--Neo-Color-Default", `color-mix(in srgb, color-mix(in srgb, ${color} 5%, var(--Neo-Background)), transparent)`);
        otherRoot.style.setProperty("--Neo-Color-Hover", `color-mix(in srgb, color-mix(in srgb, ${color} 15%, var(--Neo-Background)), transparent 10%)`);
        otherRoot.style.setProperty("--Neo-Color-Selected", `color-mix(in srgb, color-mix(in srgb, ${color} 10%, var(--Neo-Background)) 80%, transparent 20%)`);
        otherRoot.style.setProperty("--Neo-Glow-1", `color-mix(in srgb, ${color} 90%, white)`);
        otherRoot.style.setProperty("--Neo-Glow-2", `color-mix(in srgb, ${color} 80%, white)`);
        otherRoot.style.setProperty("--Neo-Glow-3", `color-mix(in srgb, ${color} 70%, white)`);
        otherRoot.style.setProperty("--Neo-Glow-Filter-1", `drop-shadow(0px 0px 4px ${color})`);
        otherRoot.style.setProperty("--Neo-Glow-Filter-2", `drop-shadow(0px 0px 6px ${color})`);
        otherRoot.style.setProperty("--Neo-Glow-Filter-3", `drop-shadow(0px 0px 8px ${color})`);
        otherRoot.style.setProperty("--Neo-Blur-Color", `color-mix(in srgb, ${color} 2%, var(--Neo-Background) 63%)`);
        otherRoot.style.setProperty("--Neo-Color-Dark", `color-mix(in srgb, ${color} 10%, #000000c0)`);
        otherRoot.style.setProperty("--Neo-Color-Light", `color-mix(in srgb, ${color} 25%, white)`);
        otherRoot.style.setProperty("--Neo-Glow-Color-1", `color-mix(in srgb, ${color} 90%, white)`);
        otherRoot.style.setProperty("--Neo-Glow-Color-2", `color-mix(in srgb, ${color} 80%, white)`);
        otherRoot.style.setProperty("--Neo-Glow-Color-3", `color-mix(in srgb, ${color} 70%, white)`);
      }
    }

    // Force on workspace indicators and any zen-workspace elements
    for (let el of document.querySelectorAll("zen-workspace, .zen-current-workspace-indicator")) {
      el.style.setProperty("--zen-primary-color", color);
      el.style.setProperty("--zen-colors-primary", color);
      el.style.setProperty("--zen-colors-border", `color-mix(in srgb, ${color} 40%, transparent)`);
    }
  }

  async function checkColor() {
    try {
      const bytes = await IOUtils.read(WATCH_FILE);
      const color = new TextDecoder().decode(bytes).trim();
      if (color && color !== lastColor && color.startsWith("#")) {
        lastColor = color;
        applyColor(color);
        console.log("[matugen-sync] All Neo colors updated to:", color);
      }
    } catch(e) {}
  }

  // Fallback: read from colors.json if the color file doesn't exist yet
  async function fallbackFromColorsJson() {
    try {
      const bytes = await IOUtils.read("/home/river/.cache/wal/colors.json");
      const data = JSON.parse(new TextDecoder().decode(bytes));
      const color = data.colors?.color9;
      if (color && color.startsWith("#")) {
        lastColor = color;
        applyColor(color);
        console.log("[matugen-sync] Applied fallback color from colors.json:", color);
      }
    } catch(e) {}
  }

  interval = setInterval(checkColor, 2000);
  checkColor().then(() => {
    if (!lastColor) fallbackFromColorsJson();
  });

  window.addEventListener("unload", () => {
    if (interval) clearInterval(interval);
  });
})();
