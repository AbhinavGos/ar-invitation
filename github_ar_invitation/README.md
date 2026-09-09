# AR Wedding Invitation Demo

GitHub Pages-ready demo.

The **Open in AR** button requests browser camera permission directly from the user tap using `navigator.mediaDevices.getUserMedia()`. The page also checks whether camera access was previously denied and shows guidance.

Serve it from an HTTPS GitHub Pages URL. This prototype uses the live rear camera with a transparent Three.js scene over it. It does not yet perform image-target recognition.

Deploy: upload `index.html` to a repo, then enable GitHub Pages from **Settings -> Pages -> Deploy from branch -> main -> / (root)**.
