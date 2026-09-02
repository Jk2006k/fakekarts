# FakeKarts

A tiny browser-based 3D toon kart arena with real-time WebSocket rooms. Enter the same room code on any device connected to the server to drive together.

```sh
npm install
npm run dev
```

`npm test` checks the arcade driving model and the multiplayer room relay. `npm run build && npm start` serves the production game and WebSocket server. Deploy it to a Node.js host (rather than static-only hosting) so multiplayer connections can reach the relay.
