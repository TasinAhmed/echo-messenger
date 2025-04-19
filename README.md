# Echo

A modern, real-time messaging application built with Next.js and Socket.io.

![Echo Logo](/public/logo.png)

## 📌 Overview

Echo is a feature-rich messaging platform that enables real-time communication between users. Built with modern web technologies, Echo provides a seamless and responsive messaging experience.

**Live Demo:** [http://echo.tasin.ca](http://echo.tasin.ca)

## ✨ Features

- Real-time messaging using Socket.io
- User authentication and profile management
- Dark mode support with next-themes
- Responsive UI built with Tailwind CSS and Headless UI components
- PostgreSQL database with Drizzle ORM
- Secure user authentication with bcrypt and better-auth

## 🛠️ Tech Stack

### Frontend
- React 19
- Next.js 15
- TailwindCSS 4
- Radix UI components
- Zustand for state management
- Tanstack React Query for data fetching

### Backend
- Socket.io for real-time communication
- Supabase for backend services
- PostgreSQL with Drizzle ORM
- Next.js API routes

## 📦 Installation

### Prerequisites
- Node.js (v18 or later)
- PostgreSQL
- npm or yarn

### Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/echo.git
cd echo
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory with the following variables:
```
DATABASE_URL=
AUTH_DRIZZLE_URL=
JWT_SECRET=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

4. Set up the database
```bash
npx drizzle-kit push
```

5. Run the development server
```bash
npm run dev
# or
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application

## 🚀 Deployment

Echo is deployed at [echo.tasin.ca](https://echo.tasin.ca). You can deploy your own instance using:

### Vercel
```bash
npm run build
vercel --prod
```

### Docker
```bash
docker build -t echo-app .
docker run -p 3000:3000 echo-app
```

## 📝 API Documentation

Echo offers a WebSocket API and RESTful endpoints for messaging functionality:

### Socket Events
- `connection`: Establishes a connection
- `message`: Send a message
- `createConversation`: Create conversation

### REST Endpoints
- `GET /api/messages`: Retrieve message history
- `POST /api/messages`: Send a new message
- `GET /api/users`: Get user list
- `GET /api/conversations`: Get all user conversations
- `POST /api/conversations`: Create a conversation

## 👨‍💻 Development

### Project Structure
```
echo/
├── components/         # React components
├── lib/                # Utility functions
├── app/                # Next.js App Router
├── public/             # Static assets
├── db/                 # Database schema and migrations
├── styles/             # Global styles
└── types/              # TypeScript type definitions
```

### Commands
- `npm run dev`: Start development server
- `npm run build`: Build production bundle
- `npm run lint`: Run ESLint
- `npm run migrate`: Run database migrations
- `npm start`: Start production build

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.