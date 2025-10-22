# 💬 ChatSphere

Real-time chat application built with MERN stack featuring messaging, reactions, and media sharing.

## Features

- 🔐 JWT Authentication
- 💬 Real-time messaging with Socket.IO
- ↩️ Reply to messages
- ✏️ Edit messages
- 😊 Emoji reactions
- 📎 Image uploads (Cloudinary)
- ✅ Read receipts
- 👤 Online/offline status

## Tech Stack

**Frontend:** React, TypeScript, Tailwind CSS, Socket.IO Client  
**Backend:** Node.js, Express, MongoDB, Socket.IO, Cloudinary

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- Cloudinary account

### Installation

Clone repo
git clone https://github.com/yourusername/chatsphere.git
cd chatsphere

Backend setup
cd backend
npm install

Create .env file with MongoDB, JWT, and Cloudinary credentials
npm run dev

Frontend setup (new terminal)
cd client
npm install
npm run dev

text

### Environment Variables

**Backend `.env`:**
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:5173

text

## Usage

1. Register/Login
2. Add contacts
3. Start chatting with real-time messaging
4. React with emojis, reply to messages
5. Edit your messages
6. Share images

## API Routes

- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/messages/chat/:userId` - Get messages
- `PUT /api/messages/:id/edit` - Edit message
- `POST /api/messages/:id/reaction` - Toggle reaction

## License

MIT

## Author

**Pankaj Mehra**  