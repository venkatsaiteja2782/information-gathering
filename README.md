# Consent-Based Information Gathering System

A beginner-friendly cybersecurity demonstration using Node.js and Express.

## Features
- Sender dashboard with Generate Demo Link and Copy Link.
- Recipient consent page.
- IP address recorded only when the recipient submits the consent request.
- Browser geolocation requested through the normal permission prompt.
- Camera requested through the normal permission prompt; camera video stays on the recipient device and is not uploaded.
- Dashboard updates the current session every 2 seconds.

## Run on Windows
1. Install Node.js LTS.
2. Open Command Prompt in this folder.
3. Run `npm install`.
4. Run `npm start`.
5. Open `http://localhost:3000/dashboard`.

## Public deployment
Camera and location permissions generally require a secure HTTPS origin when used outside localhost. Deploy the same Node.js project to a Node-compatible HTTPS host. Do not expose a real recipient's information without informed consent.

## Demo flow
Dashboard -> Generate Demo Link -> Copy Link -> Recipient opens link -> Consent -> Browser permissions -> Congratulations -> Dashboard shows authorized results.


Camera snapshots: after the recipient grants camera permission, they see an explicit 'Take Snapshot' button. Only when they click it is a single JPEG snapshot sent to the dashboard; no continuous video recording or automatic snapshot is performed.
