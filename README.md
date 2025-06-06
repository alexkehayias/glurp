# About

WIP in-browser AI application lab.

## Install

```sh
npm install
```

## Run in development mode

```sh
npm run dev
```

This will start a local development server (via Vite), open your browser, and serve `index.html` with live reloading.

## Build for production

```sh
npm run build
```

This will bundle the application into `dist/` for static deployment.

## Features

- Terminal UI powered by [xterm.js](https://xtermjs.org/)
- In-browser Python execution via [Pyodide](https://pyodide.org/)
- Live feedback: type Python code, press Enter, see results or errors like a real REPL
- Output and errors are displayed in the terminal, just as in a native Python shell
