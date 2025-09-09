# FreightShark Backend API

Express.js backend with TypeScript for the FreightShark freight forwarding management system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and configure your environment variables:
```bash
cp .env.example .env
```

3. Initialize the database:
```bash
npm run db:init
```

4. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/validate` - Validate session
- `POST /api/auth/change-password` - Change password

### Quotes
- `GET /api/quotes` - Get all quotes
- `GET /api/quotes/:id` - Get single quote
- `POST /api/quotes` - Create quote (staff/admin)
- `PATCH /api/quotes/:id/status` - Update quote status
- `POST /api/quotes/:id/accept` - Accept quote and create shipment

### Quote Requests
- `GET /api/quotes/requests` - Get all quote requests (staff/admin)
- `GET /api/quotes/requests/my` - Get user's quote requests
- `GET /api/quotes/requests/:id` - Get single quote request
- `POST /api/quotes/requests` - Create quote request
- `PATCH /api/quotes/requests/:id/status` - Update request status (staff/admin)

### Shipments
- `GET /api/shipments` - Get all shipments
- `GET /api/shipments/:id` - Get single shipment with tracking
- `PATCH /api/shipments/:id/status` - Update shipment status (staff/admin)
- `PATCH /api/shipments/:id/weights` - Update actual weight (staff/admin)
- `POST /api/shipments/:id/tracking` - Add tracking event (staff/admin)
- `POST /api/shipments/:id/documents` - Upload document
- `GET /api/shipments/:id/documents` - Get shipment documents
- `DELETE /api/shipments/:id/documents/:docId` - Delete document

### Users
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get single user
- `POST /api/users` - Create user (admin)
- `PATCH /api/users/:id` - Update user profile
- `PATCH /api/users/:id/role` - Update user role (admin)
- `DELETE /api/users/:id` - Delete user (admin)
- `GET /api/users/stats/overview` - Get user statistics (admin)

### Announcements
- `GET /api/announcements` - Get active announcements
- `GET /api/announcements/all` - Get all announcements (staff/admin)
- `GET /api/announcements/:id` - Get single announcement
- `POST /api/announcements` - Create announcement (staff/admin)
- `PATCH /api/announcements/:id` - Update announcement (staff/admin)
- `DELETE /api/announcements/:id` - Delete announcement (admin)

## Database Schema

The database uses PostgreSQL with the following main tables:
- `users` - User accounts with roles (admin, staff, user)
- `sessions` - JWT session management
- `quote_requests` - Customer quote requests
- `quotes` - Price quotes for requests
- `shipments` - Active shipments
- `tracking_events` - Shipment tracking history
- `documents` - Shipment documents
- `announcements` - System announcements

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Initialize database
npm run db:init
```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - JWT expiration time (e.g., "24h")
- `PORT` - Server port (default: 5000)
- `FRONTEND_URL` - Frontend URL for CORS