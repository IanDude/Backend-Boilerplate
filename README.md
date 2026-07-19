# Backend Boilerplate

A practical backend boilerplate built with Express.js, MySQL, Passport JWT, Zod validation, role-based access control, file upload handling, CSRF protection, and rate limiting. This project is designed as a learning and production-adjacent foundation for building secure REST APIs.

## Overview

This repository demonstrates common backend concepts and patterns:

- RESTful API routing
- Authentication and authorization
- Request validation
- File uploads and downloads
- Role and permission management
- Security middleware
- Database bootstrap and migration flow
- Structured error and response handling

## Tech Stack

- Node.js
- Express.js
- MySQL via mysql2/promise
- Passport + Passport JWT
- JSON Web Tokens (JWT)
- Argon2 for password hashing
- Zod for request validation
- Multer for file uploads
- Sharp for image compression
- Helmet, HPP, CORS-ready middleware, CSRF protection, rate limiting
- Winston for logging
- Sequelize CLI for migrations and seeders

## Project Structure

```text
src/
  config/           # App, DB, Passport, environment config
  controllers/      # Route handlers by version and feature
  middlewares/      # Auth, authorization, security, uploads, logging
  repository/       # DB access layer
  routes/           # Router setup
  schemas/          # Zod validation schemas
  services/         # Business logic
  util/             # Helpers, errors, responses, tokens, file helpers
  server.js         # Application entry point

database/
  migrations/       # SQL-based migration files
  seeders/          # Seed data for roles, users, permissions
  schema.sql        # Manual schema reference
scripts/
  bootstrap.js      # Creates DB, generates JWT key pair
storage/
  uploads/          # Uploaded files (gitignored, created at runtime)
  logs/             # Runtime logs (gitignored, created at runtime)
public/
  reset-password.html
```

## Core Functionalities

### 1. Authentication

The API supports:

- User registration
- User login
- JWT-based authentication
- Password reset flow via email

Auth routes are mounted under:

- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/forgot-password
- POST /api/v1/auth/reset-password

> Note: the router also currently exposes `GET /api/v1/auth/check` and `GET /api/v1/auth/me` as internal test/debug endpoints (date formatting, auth sanity checks). These aren't finished profile-retrieval features yet — `/me` bypasses the standard response wrapper and mutates the user object for display purposes — so they're left out of the table above pending cleanup.

### 2. User Management

Users can be created, fetched, updated, deleted, and assigned or removed from roles.

User routes:

- GET /api/v1/users
- GET /api/v1/users/:userUUID
- POST /api/v1/users
- PUT /api/v1/users/:userUUID
- DELETE /api/v1/users/:userUUID
- POST /api/v1/users/:userUUID/roles
- DELETE /api/v1/users/:userUUID/roles/:roleUUID

> A transactional variant, `POST /api/v1/users/register`, also exists for creating a user within an explicit DB transaction.

### 3. Role-Based Access Control

The app uses a permission-based authorization model.

Features include:

- Roles management
- Permissions management
- Permission checks on routes via middleware
- Support for resource-level access rules

Routes:

- GET /api/v1/roles
- POST /api/v1/roles
- PUT /api/v1/roles/:roleUUID
- DELETE /api/v1/roles/:roleUUID

- GET /api/v1/permissions
- POST /api/v1/permissions
- PUT /api/v1/permissions/:permissionUUID
- DELETE /api/v1/permissions/:permissionUUID

### 4. File Uploads and Downloads

The file subsystem supports multiple upload types:

- Images
- Documents
- Audio
- Video
- Profile uploads
- Multi-file gallery uploads

Routes include:

- POST /api/v1/files
- POST /api/v1/files/profile
- POST /api/v1/files/gallery
- POST /api/v1/files/document
- POST /api/v1/files/documents
- POST /api/v1/files/audio
- POST /api/v1/files/audios
- POST /api/v1/files/video
- POST /api/v1/files/videos
- GET /api/v1/files/:fileUUID
- GET /api/v1/files/download/:fileUUID
- POST /api/v1/files/download
- PUT /api/v1/files/:fileUUID
- DELETE /api/v1/files/:fileUUID

File handling includes:

- Storage under storage/uploads
- MIME type and file integrity checks
- Image compression for image uploads
- Zip archive download support for multiple files

### 5. Security Layer

The app includes several protective layers:

- JWT authentication
- Passport JWT strategy
- CSRF protection for state-changing requests
- Request origin validation
- Rate limiting on auth, user, file, role, and permission routes
- Security headers via Helmet
- Request ID and structured logging
- Error wrapping for consistent API responses

### 6. Idempotency Support

The middleware supports idempotent requests using an Idempotency-Key header to prevent duplicate processing on retries.

This is useful for operations such as:

- Payment-like transactions
- Multi-step writes
- Retry-safe POST operations

## Environment Variables

Create a .env file in the project root with variables such as:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_password
DB_NAME=devDB
DB_POOL_SIZE=10

JWT_PRIVATE_PATH=./keys/private.key
JWT_PUBLIC_PATH=./keys/public.key
FRONTEND_URL=http://localhost:3000
CSRF_SECRET=your_csrf_secret
COOKIE_SECURE=false
ALLOW_CROSS_SITE_CSRF=false
DISABLE_CSRF=true
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

> The bootstrap script will validate required environment variables and create the database if it does not exist. It will also generate the RSA key pair used for JWT signing when missing.

## Installation

```bash
npm install
```

## Running the Project

### Development setup

```bash
npm run setup:dev
npm run dev
```

This will:

1. Bootstrap the environment
2. Create the database if needed
3. Run database migrations
4. Seed initial data
5. Start the server in watch mode

### Production-style startup

```bash
npm start
```

`npm start` automatically runs the `prestart` hook first (environment validation, database bootstrap, and migrations) before the server itself boots — there's no need to run it as a separate step.

## Database Workflow

The project uses MySQL with Sequelize CLI migrations and seeders.

Useful commands:

```bash
npm run migrate
npm run migrate:undo
npm run seed
npm run seed:undo
```

### Database notes

- Migrations live in database/migrations
- Seeds live in database/seeders
- A schema reference is available in database/schema.sql

## API Response Format

The API uses a consistent success/error structure:

```json
{
  "success": true,
  "message": "Logged In Successfully",
  "data": {}
}
```

Error responses look like:

```json
{
  "success": false,
  "message": "Invalid email or password",
  "code": "INVALID_CREDENTIALS",
  "error": "Invalid email or password"
}
```

## Notes

- The project is structured for learning and extensibility.
- The router is versioned under /api/v1.
- The app is ready for further expansion with features such as refresh tokens, a proper `/me` profile endpoint, email verification, audit logs, and more advanced multi-tenant logic.

## Suggested Next Improvements

- Replace the debug `/auth/me` and `/auth/check` endpoints with a finished profile-retrieval route
- Add refresh token support
- Add email verification flow
- Add unit and integration tests
- Add OpenAPI documentation
- Improve deployment configuration and environment hardening
