# FakeKarts

A tiny browser-based 3D toon kart arena with peer-to-peer multiplayer rooms. Create a room, share its six-character code, and compete for the top spot on the distance leaderboard.

```sh
npm install
npm run dev
```

`npm test` checks the arcade driving model and `npm run build` creates the production bundle. Multiplayer uses WebRTC through PeerJS Cloud signaling, so the game works on static hosts such as Vercel without a separate WebSocket server. The room creator must remain online while others play.
