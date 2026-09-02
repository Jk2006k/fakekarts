# FakeKarts

A tiny browser-based 3D toon kart arena with shared multiplayer rooms. Create a room, share its six-character code, and compete for the top spot on the distance leaderboard.

```sh
npm install
npm run dev
```

`npm test` checks the arcade driving model and `npm run build` creates the production bundle. Multiplayer uses MQTT over secure WebSockets, so it works across different networks on static hosts such as Vercel without depending on the room creator as a peer host.
