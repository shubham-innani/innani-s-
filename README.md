# Innani's

A full-stack web application built with **React.js, Node.js, Express.js, and MongoDB**.

## 🚀 Features

* Modern and responsive user interface
* React.js frontend with Vite
* Tailwind CSS styling
* Node.js + Express.js backend
* MongoDB database using Mongoose
* REST API integration
* User authentication
* Data creation, updating, and deletion
* Mobile-friendly interface

## 🛠️ Tech Stack

### Frontend

* React.js
* Vite
* JavaScript
* Tailwind CSS
* HTML5 / CSS3

### Backend

* Node.js
* Express.js
* JavaScript
* REST APIs

### Database

* MongoDB
* Mongoose

### Deployment

* Frontend: Vercel
* Backend: Render
* Database: MongoDB Atlas

## 📁 Project Structure

```text
innani-s-
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── App.jsx
│   ├── main.jsx
│   ├── vite.config.js
│   └── package.json
│
├── backend/
│   ├── server.js
│   ├── routes/
│   ├── models/
│   ├── controllers/
│   └── package.json
│
└── README.md
```

> The exact folder structure may vary depending on the current project organization.

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/shubham-innani/innani-s-.git
cd innani-s-
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

### 3. Install backend dependencies

```bash
cd ../backend
npm install
```

## 🔐 Environment Variables

Create a `.env` file in the backend directory.

```env
MONGODB_URI=your_mongodb_connection_string
PORT=5000
```

For the frontend, if required:

```env
VITE_API_URL=http://localhost:5000
```

**Never commit your `.env` file or database credentials to GitHub.**

## ▶️ Running the Project

### Start the backend

```bash
cd backend
npm start
```

### Start the frontend

Open another terminal:

```bash
cd frontend
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

The backend will normally run at:

```text
http://localhost:5000
```

## 🔗 Application Architecture

```text
React + Vite
     │
     │ API Requests
     ▼
Node.js + Express
     │
     │ Database Queries
     ▼
MongoDB
```

For production:

```text
📱 User
   │
   ▼
Vercel
React Frontend
   │
   ▼
Render
Node + Express Backend
   │
   ▼
MongoDB Atlas
Database
```

## 🌐 Deployment

The application can be deployed using:

* **Frontend:** Vercel
* **Backend:** Render
* **Database:** MongoDB Atlas

After deployment, update the frontend API URL to point to the deployed backend.

Example:

```env
VITE_API_URL=https://your-backend.onrender.com
```

## 📱 Mobile Support

The application is responsive and can be accessed from mobile devices using the deployed Vercel URL.

## 👨‍💻 Author

**Shubham Innani**

GitHub:
https://github.com/shubham-innani

## 📄 License

This project is for educational and personal use.
