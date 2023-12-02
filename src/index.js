const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const {
  generateMessage,
  generateLocationMessage,
} = require('./utils/messages');

const {
  addUser,
  getUser,
  getUsersInRoom,
  removeUser,
} = require('./utils/users');

const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(cors());
app.use(express.static(publicDirectoryPath));

// let count = 0;
io.on('connection', (socket) => {
  console.log('new Connection ');

  socket.on('join', (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options });
    if (error) {
      return callback(error);
    }

    socket.join(user.room);

    socket.emit(
      'message',
      generateMessage('Admin', `hi ${user.username} Wellcome to ${user.room}`)
    );
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        generateMessage('Admin', `${user.username} joined the room.`)
      );

    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);
    if (!user) {
      return callback('Cannot find chat');
    }
    const filter = new Filter();

    if (filter.isProfane(message)) {
      return callback('Profanity is not allowed!');
    }

    io.to(user.room).emit('message', generateMessage(user.username, message));
    callback();
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        'message',
        generateMessage('Admin', `${user.username} left the chat!`)
      );

      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });

  socket.on('sendLocation', ({ latitude, longitude }, callback) => {
    const user = getUser(socket.id);
    if (!user) {
      return callback('Chat not found');
    }

    io.to(user.room).emit(
      'locationMessage',
      generateLocationMessage(user.username, latitude, longitude)
    );
    callback();
  });
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(publicDirectoryPath, 'chat.html'));
});

server.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
