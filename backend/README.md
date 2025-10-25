AI Debate Judge - Backend
Backend API server for the AI-powered debate platform with blockchain integration.

Features
User authentication (JWT-based)
Real-time debate management with Socket.IO
AI judge integration for automated scoring
Blockchain integration for immutable results
User statistics and leaderboards
RESTful API architecture
Tech Stack
Node.js with Express.js
MongoDB with Mongoose ODM
Socket.IO for real-time communication
JWT for authentication
bcrypt for password hashing
Project Structure
backend/
├── server.js                 # Main server file
├── models/
│   ├── User.js              # User model
│   └── Debate.js            # Debate model
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── debates.js           # Debate management routes
│   └── users.js             # User profile routes
├── middleware/
│   ├── auth.js              # Authentication middleware
│   └── errorHandler.js      # Error handling middleware
├── config/
│   └── database.js          # Database configuration
├── utils/
│   └── validators.js        # Input validation utilities
├── .env.example             # Environment variables template
├── .gitignore
├── package.json
└── README.md
Installation
Clone the repository
bash
cd backend
Install dependencies
bash
npm install
Set up environment variables
bash
cp .env.example .env
Edit .env with your configuration:

MongoDB URI
JWT secret
AI service URL
Blockchain service URL
Frontend URL
Start MongoDB
bash
# If using local MongoDB
mongod
Run the server
bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
Server will run on http://localhost:5000

API Endpoints
Authentication
POST /api/auth/register - Register new user
POST /api/auth/login - Login user
GET /api/auth/verify - Verify JWT token
Debates
GET /api/debates - Get all debates (with filters)
GET /api/debates/:id - Get specific debate
POST /api/debates - Create new debate
POST /api/debates/:id/join - Join a debate
POST /api/debates/:id/arguments - Submit argument
POST /api/debates/:id/judge - Request AI judgment
POST /api/debates/:id/end - End debate manually
Users
GET /api/users/:id - Get user profile
PUT /api/users/profile - Update user profile
GET /api/users/leaderboard/top - Get leaderboard
Socket.IO Events
Client → Server
join-debate - Join a debate room
leave-debate - Leave a debate room
send-argument - Send an argument (deprecated, use REST API)
Server → Client
user-joined - User joined the debate
new-argument - New argument submitted
debate-ended - Debate ended
debate-judged - AI judgment completed
Database Models
User Schema
javascript
{
  username: String,
  email: String,
  password: String (hashed),
  walletAddress: String,
  stats: {
    totalDebates: Number,
    wins: Number,
    losses: Number,
    averageScore: Number
  },
  createdAt: Date
}
Debate Schema
javascript
{
  topic: String,
  description: String,
  sideA: {
    position: String,
    participants: [UserId]
  },
  sideB: {
    position: String,
    participants: [UserId]
  },
  arguments: [{
    side: 'A' | 'B',
    content: String,
    speaker: UserId,
    roundNumber: Number,
    timestamp: Date
  }],
  structure: {
    type: 'time-limited' | 'round-limited',
    maxRounds: Number,
    timeLimit: Number
  },
  currentRound: Number,
  status: 'pending' | 'active' | 'completed' | 'judged',
  judgeResult: {
    sideAScore: Number,
    sideBScore: Number,
    reasoning: String,
    winner: 'A' | 'B' | 'tie',
    judgedAt: Date,
    blockchainTxHash: String,
    blockchainVerified: Boolean
  },
  createdBy: UserId,
  createdAt: Date,
  completedAt: Date
}
Integration with Other Services
AI Service
The backend expects an AI service running on the configured URL with:

POST /judge endpoint
Request body: { topic, sideAPosition, sideBPosition, arguments[] }
Response: { sideAScore, sideBScore, reasoning, winner }
Blockchain Service
The backend calls a blockchain service to record results:

POST /record-result endpoint
Request body: { debateId, sideAScore, sideBScore, winner, reasoning }
Response: { transactionHash }
Security Features
Password hashing with bcrypt (10 salt rounds)
JWT-based authentication
Protected routes with authentication middleware
Input validation
CORS configuration
Error handling middleware
Development
Running in Development Mode
bash
npm run dev
Testing API with curl
Register a user:

bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
Create a debate:

bash
curl -X POST http://localhost:5000/api/debates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"topic":"AI Ethics","sideAPosition":"AI should be regulated","sideBPosition":"AI should remain unregulated"}'
Environment Variables
Variable	Description	Default
PORT	Server port	5000
MONGODB_URI	MongoDB connection string	mongodb://localhost:27017/debate-judge
JWT_SECRET	Secret key for JWT	-
FRONTEND_URL	Frontend URL for CORS	http://localhost:3000
AI_SERVICE_URL	AI service endpoint	http://localhost:8000
BLOCKCHAIN_SERVICE_URL	Blockchain service endpoint	http://localhost:8545
Contributing
Create a feature branch
Make your changes
Test thoroughly
Submit a pull request
License
MIT

