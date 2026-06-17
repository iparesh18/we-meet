// Holds the Socket.IO server instance so services can emit events without
// circular imports. Set once in index.js after the server is created.
let _io = null;

export function setIO(io) {
  _io = io;
}

export function getIO() {
  return _io;
}

export const rooms = {
  class: (code) => `class:${code}`, // everyone in the class (host + students)
  host: (code) => `host:${code}`, // host-only channel (waiting list, etc.)
  participant: (id) => `participant:${id}`, // a single student's private channel
};
