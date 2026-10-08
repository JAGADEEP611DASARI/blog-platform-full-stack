# Blog Platform with Comments — Full Stack

A complete full-stack blogging platform using React, Node.js, Express, MongoDB and JWT authentication.

## Features
- User registration and login
- JWT authentication
- Create, edit and delete blog posts
- Public blog listing and single-post view
- Comments with delete support
- User/admin-friendly navigation
- Responsive UI
- RESTful APIs
- MongoDB database integration

## Project structure
- `frontend/` — React + Vite
- `backend/` — Express + MongoDB

## Run backend
```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Set `MONGO_URI` in `.env`. Example:
`mongodb://127.0.0.1:27017/blog_platform`

Backend runs on `http://localhost:5000`.

## Run frontend
Open another terminal:
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on the Vite URL shown in the terminal, normally `http://localhost:5173`.

## API
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/posts`
- GET `/api/posts/:id`
- POST `/api/posts`
- PUT `/api/posts/:id`
- DELETE `/api/posts/:id`
- GET `/api/posts/:id/comments`
- POST `/api/posts/:id/comments`
- DELETE `/api/comments/:id`

The frontend automatically sends the JWT in the Authorization header.
