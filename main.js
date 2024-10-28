const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const uuid = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const chatRooms = {};
app.use(express.static('public'));
app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/public/admin.html');
});
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});
app.get('/chat/:roomId', (req, res) => {
    res.sendFile(__dirname + '/public/chat.html');
});
app.get('/user/:roomId', (req, res) => {
    res.sendFile(__dirname + '/public/admin/chat.html');
});

io.on('connection', (socket) => {
    socket.on('join room', (roomId) => {
        socket.join(roomId);
        if (!chatRooms[roomId]) {
            chatRooms[roomId] = { messages: [], userName: '', userEmail: '' };
        }
    });

    socket.on('chat message', ({ roomId, msg, userName, userEmail }) => {
        if (!chatRooms[roomId].userName) {
            chatRooms[roomId].userName = userName;
            chatRooms[roomId].userEmail = userEmail;
        }

        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const messageData = { content: msg, sender: 'user', time: timestamp };
        chatRooms[roomId].messages.push(messageData);
        io.to(roomId).emit('chat message', messageData);
    });
    socket.on('get chat list', () => {
        const chatList = Object.keys(chatRooms).map(roomId => ({
            id: roomId,
            userName: chatRooms[roomId].userName,
            userEmail: chatRooms[roomId].userEmail
        }));
        socket.emit('chat list', chatList);
    });
    socket.on('admin message', ({ roomId, msg }) => {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const messageData = { content: msg, sender: 'admin', time: timestamp };
        
        chatRooms[roomId].messages.push(messageData);
        io.to(roomId).emit('chat message', messageData);
    });
    socket.on('end chat', ({ roomId }) => {
        if (chatRooms[roomId]) {
            delete chatRooms[roomId];
            socket.to(roomId).emit('chat ended');
        }
    });
});

server.listen(5001, () => {
    console.log('Server running on http://localhost:5001');
});
