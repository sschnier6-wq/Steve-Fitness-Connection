# Steve's Fitness Tracker

Simple static web app for logging strength workouts at Fitness Connection (McDermott / Allen) and tracking progressive overload.

## Features

- **Tabs**: Upper Body • Lower Body • Core & Mobility • Aerobic • History
- Equipment cards with photos of the actual machines you have been using
- Log weight + reps per set (multiple sets supported)
- Automatic **Next Workout Suggestion** that progresses from your last logged sets
- Local storage – data stays on your device / browser
- Mobile-friendly, works offline after first load
- Ready for GitHub Pages

## How to use on GitHub Pages

1. Create a new repository (or use an existing one)
2. Upload **all** files from this folder (everything is in the root – no subfolders)
3. In the repo Settings → Pages → Source: Deploy from branch `main` / root
4. Your app will be live at `https://YOUR_USERNAME.github.io/REPO_NAME/`

Alternatively just open `index.html` locally in a browser.

## Flat Structure (no folders)

```
index.html
styles.css
app.js
manifest.json
README.md
chest-press.jpg
seated-leg-press.jpg
shoulder-press.jpg
seated-row.jpg
biceps-curl.jpg
triceps-extension.jpg
fixed-pulldown.jpg
seated-dip.jpg
leg-curl-hoist.jpg
seated-leg-curl.jpg
leg-extension.jpg
leg-extension-2.jpg
leg-press-2.jpg
dumbbell-rack.jpg
ab-crunch.jpg
exercise-bike.jpg
... (all other equipment photos)
```

Just zip everything and extract as the root of your GitHub Pages site.

## Notes

- Data is stored in the browser's localStorage under the key `fitnessHistory`.
- Clearing site data or using a different browser/device will reset history.
- Suggestion engine looks at your most recent logged top sets and proposes modest progressive overload.
- Core section includes both machine and bodyweight/mobility options that fit your height and goals.

## Add to iPhone Home Screen

1. Open the app in Safari (after publishing to GitHub Pages or opening the local files).
2. Tap the Share button (square with arrow).
3. Scroll and tap **Add to Home Screen**.
4. Confirm the name (“Fitness”) and tap Add.

The custom icon will appear on your home screen and the app will open in standalone mode (no Safari chrome).
