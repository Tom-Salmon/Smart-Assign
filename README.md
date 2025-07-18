# Task Management System

A robust, event-driven backend system for task and worker management built with Node.js, TypeScript, Kafka, MongoDB, and Redis.

## 🏗️ Architecture

This system implements a modern microservice architecture with:

- **REST API Layer**: Express.js with professional error handling
- **Event-Driven Processing**: Apache Kafka for asynchronous operations  
- **Data Persistence**: MongoDB with Redis caching
- **Type Safety**: Full TypeScript implementation
- **Professional Error Handling**: Custom error types with Result pattern

## 🚀 Features

### Task Management
- ✅ Create, read, update, delete tasks
- ✅ Task assignment to workers with skill matching
- ✅ Load balancing based on worker capacity
- ✅ Task status tracking (todo → in-progress → done)
- ✅ Priority and deadline management

### Worker Management  
- ✅ Worker registration and management
- ✅ Skill-based task assignment
- ✅ Load tracking and capacity management
- ✅ Real-time worker status updates

### System Features
- ✅ Event-driven architecture with Kafka
- ✅ Redis caching for performance
- ✅ Comprehensive error handling
- ✅ Input validation and sanitization
- ✅ Professional logging
- ✅ Type-safe operations

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Web Framework**: Express.js
- **Message Broker**: Apache Kafka
- **Database**: MongoDB with Mongoose
- **Cache**: Redis
- **Process Manager**: Docker Compose

## 📁 Project Structure

```
src/
├── api/                 # REST API layer
│   ├── app.ts          # Express app configuration
│   └── routes/         # API route handlers
├── kafka/              # Event processing
│   ├── kafkaProducer.ts
│   ├── topicRouter.ts
│   └── kafkaEvents.ts
├── models/             # Database models
│   └── mongoClient.ts
├── services/           # Business logic
│   ├── taskHandler.ts
│   ├── workerHandler.ts
│   ├── kafkaClient.ts
│   ├── redisClient.ts
│   └── logger.ts
├── types/              # TypeScript definitions
│   ├── entities.ts
│   ├── errors.ts
│   └── validation.ts
├── config/             # Configuration
└── test/               # System tests
```

## 🚦 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Project1

# Install dependencies
npm install

# Start infrastructure services (MongoDB, Redis, Kafka, Zookeeper)
npm run services:start

# Wait for services to be ready (about 10-15 seconds)
# Then start the application
npm start
```

### Alternative: One-Command Startup

```bash
# Start services and application together (recommended)
npm run app:start
```

### Important Notes

⚠️ **Service Startup Time**: Docker services need 10-15 seconds to fully initialize before starting the application.

⚠️ **Port Requirements**: Ensure ports 3000, 27017, 6379, 9092, and 2181 are available.

⚠️ **Docker**: Make sure Docker Desktop is running before starting services.

### API Endpoints

The server runs on `http://localhost:3000`

#### Health Check
- `GET /health` - Health check endpoint

#### Tasks
- `GET /api/tasks` - List all tasks (returns metadata object)
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create new task (async via Kafka)
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:taskId/assign/:workerId` - Assign task to worker
- `POST /api/tasks/:taskId/unassign` - Unassign task
- `POST /api/tasks/:taskId/finish` - Mark task as completed

#### Workers
- `GET /api/workers` - List all workers (returns metadata object)
- `GET /api/workers/:id` - Get worker by ID
- `POST /api/workers` - Create new worker (async via Kafka)
- `PUT /api/workers/:id` - Update worker
- `DELETE /api/workers/:id` - Delete worker

## 🚀 Quick Example Usage

### For Windows (PowerShell)

```powershell
# 1. Start the system
npm run services:start
# Wait 10-15 seconds for services to initialize
Start-Sleep -Seconds 15
npm start

# 2. Test health check
Invoke-WebRequest -Uri "http://localhost:3000/health" -Method GET

# 3. Create a worker (will be processed via Kafka)
$workerBody = '{"name":"John Developer","skills":["JavaScript","Node.js"],"maxLoad":10,"bio":"Senior developer"}'
Invoke-WebRequest -Uri "http://localhost:3000/api/workers" -Method POST -ContentType "application/json" -Body $workerBody

# Note: Worker creation is asynchronous via Kafka. Wait a moment before checking if the worker was created.
Start-Sleep -Seconds 2

# 4. Create a task (will be processed via Kafka) 
$taskBody = '{"title":"Build API","description":"Create REST endpoints","priority":8,"timeToComplete":3600,"requiredSkills":["JavaScript"],"load":5}'
Invoke-WebRequest -Uri "http://localhost:3000/api/tasks" -Method POST -ContentType "application/json" -Body $taskBody

# Note: Task creation is asynchronous via Kafka. Wait a moment before checking if the task was created.
Start-Sleep -Seconds 2

# 5. Get all workers and tasks
Invoke-WebRequest -Uri "http://localhost:3000/api/workers" -Method GET
Invoke-WebRequest -Uri "http://localhost:3000/api/tasks" -Method GET

# 6. Assign task to worker (replace with actual IDs from step 5)
Invoke-WebRequest -Uri "http://localhost:3000/api/tasks/{TASK_ID}/assign/{WORKER_ID}" -Method POST
```

### For Linux/Mac (Bash)

```bash
# 1. Start the system
npm run services:start
# Wait 10-15 seconds for services to initialize
sleep 15
npm start

# 2. Test health check
curl http://localhost:3000/health

# 3. Create a worker (will be processed via Kafka)
curl -X POST http://localhost:3000/api/workers \
  -H "Content-Type: application/json" \
  -d '{"name":"John Developer","skills":["JavaScript","Node.js"],"maxLoad":10,"bio":"Senior developer"}'

# Note: Worker creation is asynchronous via Kafka. Wait a moment before checking.
sleep 2

# 4. Create a task (will be processed via Kafka) 
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Build API","description":"Create REST endpoints","priority":8,"timeToComplete":3600,"requiredSkills":["JavaScript"],"load":5}'

# Note: Task creation is asynchronous via Kafka. Wait a moment before checking.
sleep 2

# 5. Get all workers and tasks
curl http://localhost:3000/api/workers
curl http://localhost:3000/api/tasks

# 6. Assign task to worker (use actual IDs from step 5)
curl -X POST http://localhost:3000/api/tasks/{TASK_ID}/assign/{WORKER_ID}
```
  -d '{"title":"Build API","description":"Create REST endpoints","priority":8,"timeToComplete":3600,"requiredSkills":["JavaScript"],"load":5}'

# Note: Task creation is asynchronous via Kafka. Wait a moment before checking.
sleep 2

# 5. Get all workers and tasks
curl http://localhost:3000/api/workers
curl http://localhost:3000/api/tasks

# 6. Assign task to worker (use actual IDs from step 5)
curl -X POST http://localhost:3000/api/tasks/{TASK_ID}/assign/{WORKER_ID}

## 📊 Data Flow Overview

```text
┌─────────────────────────────┐
│      REST API (Express)     │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│      Input Validation       │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│       Kafka Producer        │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│        Topic Router         │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│   Business Logic (Service Layer)        │
└─────────────┬─────────────┬─────────────┘
              │             │
              ▼             ▼
    ┌─────────────┐ ┌─────────────┐
    │   MongoDB   │ │    Redis    │
    │(Persistence)│ │  (Caching)  │
    └─────────────┘ └─────────────┘
              │             │
              ▼             ▼
┌─────────────────────────────────────────┐
│      Error Handling & Response          │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────┐
│   REST API Response         │
└─────────────────────────────┘
```

**Description:**
- Requests enter via the REST API (Express)
- Data is validated before being sent to Kafka for event-driven processing
- The Topic Router directs events to the appropriate business logic handlers
- Business logic interacts with MongoDB for persistence and Redis for caching
- Errors are handled consistently and returned to the API layer
- Data flow supports both synchronous (direct API) and asynchronous (Kafka) operations

## 🧪 Testing

### Windows PowerShell Examples

```powershell
# Run system tests (requires running services)
npm test

# Start services and run integration test
npm run test:integration

# Manual API Testing
Invoke-WebRequest -Uri "http://localhost:3000/health" -Method GET
Invoke-WebRequest -Uri "http://localhost:3000/api/workers" -Method GET
Invoke-WebRequest -Uri "http://localhost:3000/api/tasks" -Method GET

# Create a worker
$body = '{"name":"John Dev","skills":["JavaScript","Node.js"],"maxLoad":10,"bio":"Developer"}'
Invoke-WebRequest -Uri "http://localhost:3000/api/workers" -Method POST -ContentType "application/json" -Body $body

# Create a task
$body = '{"title":"API Task","description":"Build REST API","priority":8,"timeToComplete":3600,"requiredSkills":["JavaScript"],"load":5}'
Invoke-WebRequest -Uri "http://localhost:3000/api/tasks" -Method POST -ContentType "application/json" -Body $body
```

#### PowerShell: Viewing Full API Responses

PowerShell's `Invoke-WebRequest` may truncate long responses in the default display. To see the complete JSON data:

```powershell
# Method 1: Access the Content property directly
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/tasks" -Method GET
$response.Content

# Method 2: Parse and format JSON nicely  
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/tasks" -Method GET
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10

# Method 3: One-liner for quick viewing
(Invoke-WebRequest -Uri "http://localhost:3000/api/tasks" -Method GET).Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

**Why this matters:** PowerShell displays the `Invoke-WebRequest` object's summary by default, which may truncate the response. The enhanced API format (with metadata objects) combined with these commands ensures you see all response data.

### Linux/Mac Bash Examples

```bash
# Run system tests (requires running services)
npm test

# Manual API Testing
curl -X GET http://localhost:3000/health
curl -X GET http://localhost:3000/api/workers
curl -X GET http://localhost:3000/api/tasks

# Create a worker
curl -X POST http://localhost:3000/api/workers \
  -H "Content-Type: application/json" \
  -d '{"name":"John Dev","skills":["JavaScript","Node.js"],"maxLoad":10,"bio":"Developer"}'

# Create a task
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"API Task","description":"Build REST API","priority":8,"timeToComplete":3600,"requiredSkills":["JavaScript"],"load":5}'
```

## 🔧 Development Scripts

```bash
npm start                # Start the application
npm run dev             # Development mode with auto-reload
npm test                # Run system tests

# Docker Services Management
npm run services:start  # Start Docker services (MongoDB, Redis, Kafka, Zookeeper)
npm run services:stop   # Stop Docker services
npm run services:restart # Restart all services
npm run docker:up       # Alternative: Start services
npm run docker:down     # Alternative: Stop services
npm run docker:logs     # View service logs

# Complete Application Startup
npm run app:start       # Start services + wait + start application (recommended for Windows)

# Testing & Integration
npm run test:integration # Start services + run integration tests (Windows only - uses timeout)

# Cleanup
npm run clean           # Stop services and clean Docker resources

# Code Quality
npm run lint            # Run ESLint
npm run format          # Format code with Prettier (if available)
npm run build           # Compile TypeScript
```

**Note:** Some scripts use Windows-specific commands (`timeout /t`). For Linux/Mac, use manual commands:
```bash
# Instead of npm run app:start
npm run services:start && sleep 3 && npm start

# Instead of npm run test:integration  
npm run services:start && sleep 5 && npm test
```

## 🏛️ Architecture Patterns

### Event-Driven Design
- Asynchronous task/worker creation via Kafka
- Decoupled components for scalability
- Reliable message processing

### Error Handling Strategy
- Custom error types (ValidationError, NotFoundError, BusinessLogicError)
- Consistent error responses across API
- Graceful failure handling

### Data Layer
- MongoDB for persistent storage
- Redis for caching frequently accessed data
- Optimistic concurrency control

### Type Safety
- Full TypeScript coverage
- Runtime validation
- Compile-time error detection