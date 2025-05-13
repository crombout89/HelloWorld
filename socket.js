module.exports = function (io) {
  io.on('connection', (socket) => {
    console.log('🔌 A user connected');

    socket.on('join', (userId) => {
      socket.join(userId);
      console.log(`✅ User ${userId} joined their notification room`);
    });
  });
};