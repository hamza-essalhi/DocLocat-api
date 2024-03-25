/*
  Copyright (c) 2024 Hamza Essalhi
  "Programs must be written for people to read, and only incidentally for machines to execute."
  - Harold Abelson
*/

const express = require('express');
const mongoose = require('mongoose');
const config = require('./configs/config');
const verifyToken = require('./middlewares/TokenMiddleware');
const verifySocketToken = require('./middlewares/MiddlewareSocket')
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const notFound = require('./middlewares/notFound');
const path = require('path');

// Imported Routes
const authRoutes = require('./Routes/authRoutes');
const appointmentRoutes = require('./Routes/appointmentRoutes');
const favoriteRoutes = require('./Routes/favoriteRoutes');
const historyRoutes = require('./Routes/historyRoutes');
const userRoutes = require('./Routes/userRoutes');
const notificationRoutes = require('./Routes/notificationRoutes');
// Connect to MongoDB using Mongoose
mongoose.connect(config.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to the database without any issues!'))
  .catch(error => console.error('Error connecting to the database:', error));


const app = express();
const corsOptions = {
  origin: ["http://localhost:3000"],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,  // Enable credentials (cookies, authorization headers, etc.)
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Use this for parsing application/x-www-form-urlencoded data
app.use(helmet()); // Helmet middleware for setting secure HTTP headers

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
/* app.use(limiter); */

// Routes with Token Verification Middleware
app.use('/api/auth', authRoutes);
app.use('/api/favorites', verifyToken, favoriteRoutes); // Removed trailing slash
app.use('/api/appointments', verifyToken, appointmentRoutes); // Removed trailing slash
app.use('/api/history', verifyToken, historyRoutes);
app.use('/api/users', userRoutes); // Removed trailing slash
app.use('/api/notifications', verifyToken, notificationRoutes); // Removed trailing slash

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Handle Not Found - This should be the last middleware added
app.use(notFound);

const port = config.PORT || 7000; // Using OR operator for default port
const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

const io = require("socket.io")(server, {
  pingTimeout: 1000,
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});


io.use((socket, next) => {
  verifySocketToken(socket, next);
});

// Create an object to store user socket mappings
const userSockets = {};

io.on("connection", (socket) => {
  socket.on("user", (userId) => {
    userSockets[userId] = socket.id;
  });

  socket.on("new appointment", (data, notification) => {
    if (data.userId in userSockets || data.doctorId in userSockets) {
      if (data.userId in userSockets) {
        const userSocketId = userSockets[data.userId];
        io.to(userSocketId).emit("get appointment", data);
        notification && io.to(userSocketId).emit("get notification", notification);
      }

      if (data.doctorId in userSockets) {
        const doctorSocketId = userSockets[data.doctorId];
        io.to(doctorSocketId).emit("get appointment", data);
        notification && io.to(doctorSocketId).emit("get notification", notification);
      }
    }

  });
  socket.on("new notification", (data) => {
    const userSocketId = userSockets[data.userId];
    io.to(userSocketId).emit("get notification", data);
  });
  socket.on("delete notification", (data) => {
    const userSocketId = userSockets[data.userId];
    io.to(userSocketId).emit("get deleted notification", data);
  })
 
  socket.on("disconnect", () => {
    const userId = Object.keys(userSockets).find(
      (key) => userSockets[key] === socket.id
    );
    if (userId) {
      delete userSockets[userId];
    }
  });
});

