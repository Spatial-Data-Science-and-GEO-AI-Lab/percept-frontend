# Introduction

This is the frontend to the Percept project (survey running at: [https://percept.geo.uu.nl](https://percept.geo.uu.nl)). It expects to interact with a backend server, see [Percept Backend](https://www.github.com/mrd/percept-backend).

It depends on Node.js (developed with version 18.14.2) and the percept-backend server.

## Configuration

Copy `src/config.js.sample` to `src/config.js` and edit the values in the file according to the comments.

## Available Scripts

In the project directory, you can run:

### `npm install`

Downloads, builds and installs the necessary dependencies to run the app. Run this before anything else.

### `npm run dev`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm run build && serve -s build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
The app is ready to be deployed!

