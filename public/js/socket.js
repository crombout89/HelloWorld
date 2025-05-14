const socket = io();

if (window.userId) {
  socket.emit("join", window.userId);
}

window.appSocket = socket; // make it accessible globally
