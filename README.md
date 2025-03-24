# Faceproj Setup Instructions

To run the project, you will need to open two Terminal windows and follow these steps:

## 1. Frontend Setup

In the first Terminal window:

1. **Navigate to the project directory:**
    ```bash
    cd faceproj
    ```

2. **Install the dependencies (skip if already done):**
    ```bash
    npm install
    ```

3. **Start the Next.js frontend:**
    ```bash
    npm run dev
    ```

4. In chrome, go to this URL:

chrome://flags/#unsafely-treat-insecure-origin-as-secure

In the text box, paste in these http://192.168.29.150:3000, http://localhost:3000
as one comma-seperated line,
or whatever address Next.js gives you (as these may change),
then switch Disabled to Enabled in the dropdown on the side.
A popup will come on the bottom asking to Relaunch Chrome, click it.

This is necessary to enable webcam to work on a localhost site.

## 2. Backend Setup

In the second Terminal window:

1. **Navigate to the server directory:**
    ```bash
    cd faceproj
    cd server
    ```

2. **Set up the Python environment (skip if already done):**
    ```bash
    python3 setup.py
    ```

3. **Start the Python backend:**
    ```bash
    source venv/bin/activate
    python3 server.py
    ```

    It may appear stuck, but might be initializing Tensorflow, so waiting may be good. Press Ctrl+C to exit any running processes once no longer required.