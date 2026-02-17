# FocusFalcon - Browser Extension

A Firefox extension to help users maintain focus by blocking distracting websites during scheduled times or focus sessions.

## Build Instructions for Mozilla Reviewers

### Prerequisites

**Required Software:**
- **Node.js v18.x or higher** (includes npm)
  - Download from: https://nodejs.org/
  - Verify installation: `node --version` and `npm --version`

### Step-by-Step Build Process

**1. Extract the source archive**
```bash
unzip focusfalcon-source-0.1.0.zip
cd focusfalcon
```

**2. Install dependencies**
```bash
npm install
```
- Downloads all dependencies listed in `package.json`
- Creates `node_modules/` directory
- Takes 1–3 minutes depending on network speed

**3. Build the extension**
```bash
npm run build
```
- Compiles React components
- Bundles JavaScript modules
- Outputs to `dist/` directory
- Takes 10–30 seconds

**4. Verify the build**
```bash
# On Linux/Mac:
ls -la dist/

# On Windows (PowerShell):
dir dist/
```

Expected output structure:
```
dist/
├── assets/
│   ├── storage.js
│   └── popup-CAPYVjLQ.css
├── icons/
│   ├── avatar-capybara.png
│   ├── avatar-falcon.png
│   └── avatar-red-panda.png
├── mainpage/
│   ├── blocked.html
│   ├── blocked.css
│   └── blocked.js
├── settings/
│   ├── privacy.html
│   ├── setting.css
│   ├── setting.html
│   └── setting.js
├── manifest.json
├── popup.html
├── popup.js
└── background.js
```

### Build System Details

**Technology Stack:**
- **Build Tool:** Vite 7.2.4 (https://vitejs.dev/)
- **Bundler:** Rollup (included with Vite)
- **UI Framework:** React 19.2.0
- **Browser API:** webextension-polyfill 0.12.0

**Build Process:**
1. Vite reads `vite.config.js` configuration
2. Entry points: `popup.html` and `src/background/index.js`
3. Rollup bundles all imports and dependencies
4. React JSX is transpiled to JavaScript
5. Code is minified for production
6. Output is written to `dist/` directory


### Dependencies

All dependencies are managed via npm and listed in `package.json`. No manual downloads or external CDNs are required.

**Production Dependencies:**
- `react` ^19.2.0 — UI framework
- `react-dom` ^19.2.0 — React DOM renderer
- `webextension-polyfill` ^0.12.0 — Cross-browser extension APIs

**Development Dependencies:**
- `vite` ^7.2.4 — Build tool and dev server
- `@vitejs/plugin-react` ^5.1.1 — React support for Vite
- `eslint` ^9.39.1 — Code linting
- Additional ESLint plugins and TypeScript type definitions

All packages are downloaded from the official npm registry (https://npmjs.com). `package-lock.json` ensures exact versions are installed for reproducible builds.

### Source Code Structure

```
FocusFalcon/
├── src/
│   ├── background/
│   │   ├── index.js              # Background script entry point
│   │   ├── blockingEngine.js     # URL blocking logic
│   │   └── messageRouter.js      # Message routing between scripts
│   ├── utils/
│   │   ├── storage.js            # Browser storage helpers
│   │   └── defaults.js           # Default configuration values
│   └── popup/
│       ├── components/
│       │   └── HoldButton.jsx    # Hold-to-confirm button component
│       ├── App.jsx               # Main popup component
│       ├── main.jsx              # React entry point
│       └── popup.css             # Popup styles
├── public/
│   ├── manifest.json             # Extension manifest
│   ├── icons/                    # Extension icons and avatars
│   ├── mainpage/
│   │   ├── blocked.html          # Blocked site page
│   │   ├── blocked.js
│   │   └── blocked.css
│   └── settings/
│       ├── setting.html          # Settings page
│       ├── setting.js
│       └── setting.css
├── popup.html                    # Popup HTML entry point
├── vite.config.js                # Vite build configuration
├── package.json                  # Project dependencies
├── package-lock.json             # Locked dependency versions
└── README.md                     # This file
```

### Troubleshooting

**"npm is not recognized" / "npm: command not found"**
- Node.js is not installed or not added to PATH
- Install Node.js from https://nodejs.org/ and restart your terminal

**Build fails with "Cannot find module"**
- Run `npm install` before running `npm run build`
- Ensure `package-lock.json` is present in the root directory

**Build output differs from submitted extension**
- Ensure you are using Node.js v18.x or higher
- Delete `node_modules/` and `dist/`, then re-run `npm install` and `npm run build`

**Build takes very long or appears to hang**
- Check your internet connection (first build downloads ~150MB of dependencies)
- Run `npm install --verbose` to monitor progress

### Development Mode

For development with hot module reloading:
```bash
npm run dev
```

> **Note:** Development mode starts a local dev server and does **not** produce the final extension. Always use `npm run build` for the production version submitted to Mozilla.

### Extension Functionality

FocusFalcon helps users stay focused by:
- **Blocking distracting websites** based on a user-defined list
- **Scheduled blocking** — Block sites during specific times and days of the week
- **Focus sessions** — Start timed focus sessions with a countdown timer
- **Pause/Resume** — Temporarily disable blocking when needed
- **Streak tracking** — Track consecutive days of maintained focus

**Technical Implementation:**
- Uses `browser.webNavigation.onBeforeNavigate` API to intercept navigations
- Checks URLs against the block list and active time rules
- Redirects blocked URLs to a custom block page (`mainpage/blocked.html`)
- React-based popup UI for configuration
- All settings are persisted in `browser.storage.local`

### Reference Links

- Vite documentation: https://vitejs.dev/
- React documentation: https://react.dev/
- webextension-polyfill: https://github.com/mozilla/webextension-polyfill