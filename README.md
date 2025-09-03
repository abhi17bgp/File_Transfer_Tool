# 📱💻 File Transfer App

A modern, beautiful file transfer application that allows seamless file sharing between your phone and laptop using a MERN stack architecture.

![File Transfer App](https://img.shields.io/badge/React-18.2.0-blue) ![Express](https://img.shields.io/badge/Express-4.18.2-green) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3.5-cyan) ![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

- 🚀 **One-Click Server Start** - Start the file transfer server with a single button
- 📱 **QR Code Connection** - Scan QR code to quickly connect from your laptop
- 📁 **Drag & Drop Upload** - Intuitive file upload with drag and drop support
- 📊 **Real-time Progress** - Live upload progress bars and file list updates
- 🎨 **Modern UI** - Beautiful, minimal design with Tailwind CSS and shadcn/ui
- 📱 **Responsive Design** - Works perfectly on both mobile and desktop
- ⚡ **Fast Transfers** - Optimized for quick file transfers up to 100MB
- 🔄 **Auto-refresh** - File list updates automatically every 5 seconds
- 🎭 **Smooth Animations** - Framer Motion animations for delightful UX

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible UI components
- **Framer Motion** - Smooth animations and transitions
- **QRCode.js** - QR code generation for easy connection

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Multer** - File upload middleware
- **CORS** - Cross-origin resource sharing

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd file-transfer-app
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start both the backend server (port 5000) and frontend development server (port 3000).

### Alternative Setup

If you prefer to run the servers separately:

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm start
```

## 📖 How to Use

### Step 1: Start the Server (Mobile Device)
1. Open the app on your phone
2. Click the **"Start Server"** button
3. The app will display:
   - Server IP address
   - QR code for easy connection
   - Copy link button

### Step 2: Connect from Laptop
1. Scan the QR code with your laptop's camera, or
2. Copy the link and open it in your browser
3. The same interface will load on your laptop

### Step 3: Transfer Files
1. **Upload Files**: Drag and drop files or click to browse
2. **View Files**: See all uploaded files in a beautiful grid
3. **Download Files**: Click the download button on any file
4. **Real-time Updates**: File list updates automatically

## 🎯 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check endpoint |
| `GET` | `/api/ip` | Get server IP address |
| `POST` | `/api/upload` | Upload a file |
| `GET` | `/api/files` | Get list of uploaded files |
| `GET` | `/api/download/:filename` | Download a specific file |

## 📁 Project Structure

```
file-transfer-app/
├── backend/
│   ├── server.js          # Express server
│   ├── package.json       # Backend dependencies
│   └── uploads/           # Uploaded files directory
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── ui/        # shadcn/ui components
│   │   │   ├── FileUpload.jsx
│   │   │   ├── FileList.jsx
│   │   │   ├── ServerStatus.jsx
│   │   │   └── QRCode.jsx
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   ├── App.js         # Main App component
│   │   └── index.js       # React entry point
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
├── package.json           # Root package.json
├── README.md              # This file
└── LICENSE                # MIT License
```

## 🎨 UI Components

The app uses a custom implementation of shadcn/ui components:

- **Button** - Various button styles and sizes
- **Card** - Container components with shadows
- **Progress** - Upload progress bars
- **Toast** - Notification system
- **QRCode** - QR code generation component

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the backend directory:

```env
PORT=5000
NODE_ENV=development
```

### File Upload Limits
- Maximum file size: 100MB per file
- Supported file types: All file types
- Storage location: `backend/uploads/`

## 🚀 Deployment

### Production Build

1. **Build the frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Start the production server**
   ```bash
   cd backend
   npm start
   ```

### Docker Deployment (Optional)

```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN cd frontend && npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Framer Motion](https://www.framer.com/motion/) for smooth animations
- [QRCode.js](https://github.com/davidshimjs/qrcodejs) for QR code generation

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-username/file-transfer-app/issues) page
2. Create a new issue with detailed information
3. Include screenshots if applicable

---

**Made with ❤️ for seamless file transfers**
