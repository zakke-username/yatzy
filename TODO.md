8.11.

- remove "broadcast" helper from server's socket/io.ts
- try/catch around socket handlers
- future-proofing for redis, so socket handler (and http route) behavior should become:
  - get a copy of data from store module
  - pass the copy to game engine
  - save the engine-modified copy back to /store/
  - broadcast the modified copy
  - (use async / await)
- change the room id generator function to a basic loop. move this function into maybe game module or some utils file
- remove issueToken function from routes/rooms.ts, just do this in the route handler. change to uuid. pass this token to createPlayer in /game/ module.
- server: add TTL to rooms. review the /socket/io.ts/updateCloseTimer functionality, is it needed? can we simplify?
- "getRoomAndPlayer" is weird. just get the room by id, then find the player from the room, inside the handler.
- client: simplify session storage. just use the room code as a key and remove the helper
- AUTH FLOW: can it be simplified on the client side? Same behavior with **less abstraction**?
  - review useRoom and LobbyPage thoroughly
  - simplify, more readable
  - where is useRoom's exit helper really needed? why useCallback?
