# GEMINI.md

## Project Overview

This project is a pure front-end web application designed for testing special API calls to OpenAI, Claude, and Gemini. It provides a user-friendly interface to test various API functionalities, including tool calls, Google Search, and URL context.

The application is built with HTML, CSS, and vanilla JavaScript. All configurations and data are stored locally in the browser's Local Storage, ensuring user privacy and data security.

The main files are:
*   `index.html`: The main HTML file that defines the structure of the web page.
*   `assets/css/styles.css`: The stylesheet for the application.
*   `assets/js/config.js`: A configuration file for setting default API URL, API Key, and model.
*   `assets/js/script.js`: The main JavaScript file that contains the core logic of the application.

## Building and Running

This is a static web application and does not require a build process. To run the project, simply open the `index.html` file in a web browser.

For development, you can serve the files locally using a simple web server. For example, using Python's built-in HTTP server:

```bash
python -m http.server
```

Then, open `http://localhost:8000` in your browser.

## Development Conventions

The project follows a simple and clean coding style. The JavaScript code is written in a single file (`assets/js/script.js`) and uses modern JavaScript features. The code is well-structured and easy to understand.

The project uses a custom modal for alerts and confirmations, and it has a configuration management system for saving and loading API configurations.

The code is well-commented, and the variable and function names are descriptive.
