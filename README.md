# Real-Time Chat Application with File Sharing

A **real-time chat application** built using **Node.js**, **Express**, **MongoDB**, and **Socket.io**, with support for AWS S3 file uploads and multi-room messaging functionality.

## Features

- **Real-time Messaging:** Seamlessly send and receive messages using Socket.io.
- **Room-based Chat:** Users can create or join specific chat rooms.
- **File Sharing:** Upload files to chat rooms, with file storage handled via AWS S3.
- **Message History:** View the message history of a room upon joining.
- **Cookie Management:** Demonstrates cookie-based session management.
- **Database Integration:** MongoDB is used for storing messages, users, and room details.

---

## Tech Stack

### Backend
- **Node.js**: Runtime environment for building the server.
- **Express**: Web framework for handling HTTP requests.
- **Socket.io**: Real-time WebSocket communication.
- **MongoDB (Mongoose)**: Database for storing room, user, and message data.

### File Handling
- **Multer**: For handling file uploads.
- **AWS S3**: For storing uploaded files.

---

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas or a local MongoDB server
- AWS S3 bucket for file storage (set up credentials)

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/your-repository.git
   cd your-repository
