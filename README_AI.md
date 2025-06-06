# glurp: In-Browser Python REPL with xterm.js, Pyodide & React

## Overview

**glurp** is a modern, browser-based Python REPL (Read-Eval-Print Loop) that brings a real Python shell to your browser. Now implemented with a modern React TypeScript frontend and a split-pane UI:

- **xterm.js** terminal emulator (Python console powered by Pyodide)
- **monaco-editor** code editor
- **React** for component-driven UI and layout
- **Vite** for fast, zero-config builds and hot reload
- **micropip** for runtime Python package installation (e.g., `fastapi`, `typing-extensions`)

---

## Frontend Setup & Key Components

- **TypeScript** throughout the frontend (`.tsx` and `.ts` files)
- Uses React functional components
- Component split:
  - `src/CodeEditor.tsx` – Monaco-based Python editor
  - `src/Repl.tsx` – xterm.js + Pyodide-powered Python REPL/console
  - `src/App.tsx` – Main split-pane layout, flexbox: left=code editor, right=REPL
  - `src/main.tsx` – Renders the React application into `#root`
- **Routing:** Project is ready for [react-router-dom](https://reactrouter.com/) with future expansion; currently, both main panes are always visible for classic split workflow.
- All legacy direct DOM scripting replaced with idiomatic React logic.

---

## Code Organization

- `index.html` — Main HTML entry point
  - Loads CSS, injects React root `<div id="root">`
  - Loads your React/TypeScript entry (`src/main.tsx`)
- `src/main.tsx` — React entry point; attaches app root
- `src/App.tsx` — Split screen React layout (editor + REPL)
- `src/CodeEditor.tsx` — Monaco editor functional React component
- `src/Repl.tsx` — xterm.js + Pyodide REPL as a React functional component
- `vite.config.js` — Includes Vite React plugin and TS checker
- `package.json` — Scripts for dev, build, typecheck
- `tsconfig.json` — TypeScript configuration including `jsx: react-jsx`

---

## Key Features

### 🔹 Split-Screen UI (React Component Layout)
- Left side: Monaco-based Python code editor (with full language features, theming, etc.)
- Right side: Fully interactive xterm.js-powered terminal running a Pyodide Python REPL (with true line editing, arrow keys, paste, scrollback)
- Pure CSS Flexbox for responsive, full-height layout

### 🔹 Pyodide Integration (Python in Browser)
- Loads full WebAssembly-powered Python
- Runs virtually any pure Python code—like native `python` REPL
- Supports async code, print output, error tracebacks

### 🔹 Package Management with micropip
- Installs/imports Python packages at runtime (wheels supported via Pyodide)
- Critical ordering: `typing-extensions` always installed before `fastapi` and friends

### 🔹 Copy & Paste, Modern Tooling
- Paste to terminal fully supported
- Hot module reloading with React/Vite
- Type-checked end-to-end; can run `npm run type-check`

---

## Startup Sequence (behind the scenes)
1. React renders both panes (editor & terminal)
2. Terminal and readline attach; Pyodide loads
3. `typing-extensions` is installed (`>=4.8.0`)
4. Required core Python modules are loaded (`ssl`, `distutils`, `setuptools`)
5. FastAPI and other packages installed
6. The REPL prompt is shown and the user can start editing/running code

---

## Extending the Project
- To preinstall packages or customize layout, edit/import the relevant React components
- To add routing/navigation, use react-router and wrap/compose views in `App.tsx`
- General logic (Pyodide lifecycle, REPL communication, etc.) is within `Repl.tsx` for clear separation

---

## Limitations / Notes
- Networking and some OS-level Python modules are limited in Pyodide
- Only pure Python packages supported by [Pyodide & micropip](https://pyodide.org/en/stable/usage/packages-in-pyodide.html) will work
- Not all server frameworks work in-browser

---

## Authors & Credits
- Powered by [xterm.js](https://xtermjs.org/), [Pyodide](https://pyodide.org/), [micropip](https://pyodide.org/en/stable/usage/conda.html#micropip), [xterm-readline](https://www.npmjs.com/package/xterm-readline), [monaco-editor](https://microsoft.github.io/monaco-editor/), [React](https://react.dev/), and Vite
- AI system-generated documentation by request
