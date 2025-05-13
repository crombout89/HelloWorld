  const socket = io();

  // For now, join room using current user ID from server
  <% if (user && user._id) { %>
    socket.emit('join', '<%= user._id %>');
  <% } %>

  socket.on('notification', data => {
    alert('🔔 New Notification: ' + data.message);
    // You could also update the DOM instead of using alert
  });