const express = require('express');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const multer = require('multer'); // For file uploads
const path = require('path'); // For file path operations
const fs = require('fs'); // For file system operations
const http = require('http').createServer(app);
const mongoose = require('mongoose');
const socketio = require('socket.io');
const io = socketio(http);
const { addUser, getUser, removeUser } = require('./helper');
const Message = require('./models/Message');
const Room = require('./models/Room');

// Configure AWS SDK
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
    accessKeyId: 'AKIAQSRQPUOO7BSJUGQK',
    secretAccessKey: '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',
});
const bucketName = 'core-api-storage';

const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200,
};

const authRoutes = require('./routes/authRoutes');

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(authRoutes);

const upload = multer({
    dest: 'uploads/', // Define an upload directory
});

const mongoDB = 'mongodb+srv://charlesdhayveed:charlesdhayveed1234@cluster0.yr6amq4.mongodb.net/chat-data-base?retryWrites=true&w=majority';

mongoose
    .connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('connected');
        // Start the Socket.io server after the database connection is established
        startSocketServer();
    })
    .catch((err) => console.log(err));

const PORT = process.env.PORT || 5000;

app.get('/set-cookies', (req, res) => {
    res.cookie('username', 'Tony');
    res.cookie('isAuthenticated', true, { maxAge: 24 * 60 * 60 * 1000 });
    res.send('cookies are set');
});

app.get('/get-cookies', (req, res) => {
    const cookies = req.cookies;
    console.log(cookies);
    res.json(cookies);
});

// Update the file upload route to accept the room ID as a parameter
app.post('/upload/:room_id', upload.single('file'), (req, res) => {
    const file = req.file;
    const room_id = req.params.room_id;

    if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = getUser(socket.id); // Assuming you have user information available
    const fileName = Date.now() + '-' + file.originalname;
    const fileParams = {
        Bucket: bucketName,
        Key: fileName,
        Body: fs.createReadStream(file.path),
    };

    s3.upload(fileParams, (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'File upload to S3 failed' });
        }

        // Clean up: Delete the temporary file
        fs.unlinkSync(file.path);

        const msgToStore = {
            name: user.name,
            user_id: user.user_id,
            room_id: room_id,
            text: `File: ${file.originalname}`,
            file: {
                filename: fileName,
                originalname: file.originalname,
                url: data.Location, // URL to the S3 file
                size: file.size,
            },
        };

        const msg = new Message(msgToStore);
        msg.save().then((result) => {
            io.to(room_id).emit('message', result);
            res.send('File uploaded successfully');
        });
    });
});

// Serve uploaded files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Function to start the Socket.io server
function startSocketServer() {
    io.on('connection', (socket) => {
        console.log(socket.id);
        Room.find().then((result) => {
            socket.emit('output-rooms', result);
        });
        socket.on('create-room', (name) => {
            const room = new Room({ name });
            room.save().then((result) => {
                io.emit('room-created', result);
            });
        });
        socket.on('join', ({ name, room_id, user_id }) => {
            const { error, user } = addUser({
                socket_id: socket.id,
                name,
                room_id,
                user_id,
            });
            socket.join(room_id);
            if (error) {
                console.log('join error', error);
            } else {
                console.log('join user', user);
            }
        });
        socket.on('sendMessage', (message, room_id, callback) => {
            const user = getUser(socket.id);
            const msgToStore = {
                name: user.name,
                user_id: user.user_id,
                room_id,
                text: message,
            };
            if (message.startsWith('/reply ')) {
                const replyToMessageId = message.split(' ')[1];
                msgToStore.replyTo = replyToMessageId;
            }
            const msg = new Message(msgToStore);
            msg.save().then((result) => {
                io.to(room_id).emit('message', result);
                callback();
            });
        });
        socket.on('get-messages-history', room_id => {
            Message.find({ room_id }).then(result => {
                socket.emit('output-messages', result);
            });
        });
        socket.on('disconnect', () => {
            const user = removeUser(socket.id);
        });
    });
}

http.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});
