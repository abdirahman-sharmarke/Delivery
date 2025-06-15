# Delivery Backend API

A comprehensive Node.js backend API for delivery service management with user authentication, role-based access control, and Supabase image storage.

## Features

- 🔐 **Authentication & Authorization**: JWT-based auth with role-based access control
- 👥 **User Management**: Admin, Driver, and Customer roles with different permissions
- 📱 **Profile Management**: Complete user profiles with image upload to Supabase
- 🗺️ **Location Tracking**: Real-time location updates for drivers
- 🔒 **Security**: Rate limiting, CORS, Helmet security headers
- 📊 **Database**: PostgreSQL with Sequelize ORM
- 🖼️ **Image Storage**: Supabase storage integration for profile pictures
- ✅ **Validation**: Comprehensive input validation with express-validator

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT
- **Image Storage**: Supabase
- **File Upload**: Multer
- **Validation**: express-validator
- **Security**: Helmet, CORS, express-rate-limit

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd my-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env` file in the root directory:
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/delivery_db
PORT=3000

# Supabase Configuration
SUPABASE_URL=https://jsqcymixmcpbynjbsbdn.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_PROJECT_NAME=abdirahman-images

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12

# Upload Configuration
MAX_FILE_SIZE=5242880
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/gif,image/webp

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

4. **Database Setup**
- Create a PostgreSQL database
- Update the `DATABASE_URL` in your `.env` file
- The tables will be created automatically when you start the server

5. **Supabase Setup**
- Create a Supabase project
- Create a storage bucket named `profile-pictures`
- Make the bucket public for read access
- Update the Supabase credentials in your `.env` file

6. **Start the server**
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication

#### Register User
```http
POST /api/register
Content-Type: application/json

{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "SecurePass123",
  "role": "customer",
  "address": "123 Main St, City, Country",
  "vehicle_number": "ABC123", // Required for drivers
  "license_number": "DL123456" // Required for drivers
}
```

#### Login User
```http
POST /api/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

### User Profile Management

#### Get Current User Profile
```http
GET /api/profile
Authorization: Bearer <token>
```

#### Update User Profile
```http
PUT /api/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "full_name": "John Updated",
  "address": "456 New St, City, Country",
  "phone": "+0987654321"
}
```

#### Upload Profile Picture
```http
POST /api/profile/picture
Authorization: Bearer <token>
Content-Type: multipart/form-data

profile_picture: <image file>
```

#### Update Location (for drivers)
```http
PUT /api/profile/location
Authorization: Bearer <token>
Content-Type: application/json

{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

#### Change Password
```http
PUT /api/profile/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "current_password": "OldPassword123",
  "new_password": "NewPassword123",
  "confirm_password": "NewPassword123"
}
```

### User Management (Admin Only)

#### Get All Users
```http
GET /api/users?page=1&limit=10&role=driver&status=active&search=john
Authorization: Bearer <admin_token>
```

#### Get User by ID
```http
GET /api/users/:id
Authorization: Bearer <admin_token>
```

#### Update User (Admin or Owner)
```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "suspended",
  "role": "driver"
}
```

#### Delete User
```http
DELETE /api/users/:id
Authorization: Bearer <admin_token>
```

#### Get Users by Role
```http
GET /api/users/role/driver
Authorization: Bearer <admin_token>
```

### Utility Endpoints

#### Health Check
```http
GET /health
```

## User Data Model

```javascript
{
  "id": "uuid",
  "full_name": "string",
  "email": "string (unique)",
  "phone": "string (unique)",
  "role": "admin|driver|customer",
  "profile_picture": "string (URL)",
  "status": "active|inactive|suspended|pending",
  "address": "string",
  "vehicle_number": "string (required for drivers)",
  "license_number": "string (required for drivers)",
  "location": {
    "latitude": "number",
    "longitude": "number",
    "updated_at": "datetime"
  },
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

## User Roles & Permissions

### Admin
- Full access to all endpoints
- Can manage all users
- Can view, update, delete any user
- Can change user roles and status

### Driver
- Can update own profile and location
- Can upload profile pictures
- Vehicle number and license number are required
- Can view own profile

### Customer
- Can update own profile (except driver-specific fields)
- Can upload profile pictures
- Can view own profile

## Security Features

- **Rate Limiting**: 100 requests/15min general, 5 requests/15min for auth
- **Password Hashing**: bcrypt with configurable rounds
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive validation using express-validator
- **CORS Protection**: Configurable allowed origins
- **Security Headers**: Helmet.js for security headers
- **File Upload Security**: Type and size validation for images

## Error Handling

The API returns consistent error responses:

```javascript
{
  "success": false,
  "message": "Error description",
  "errors": [/* validation errors if any */]
}
```

## Success Responses

All successful responses follow this format:

```javascript
{
  "success": true,
  "message": "Success message",
  "data": {
    // Response data
  }
}
```

## Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

### Database Management
The application uses Sequelize migrations and will automatically sync models in development mode.

### Testing
To test the API, you can use tools like:
- Postman
- Thunder Client (VS Code extension)
- curl commands

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Configure proper database credentials
4. Set up SSL/TLS termination
5. Use PM2 or similar process manager
6. Configure reverse proxy (nginx)
7. Set up proper monitoring and logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License. 