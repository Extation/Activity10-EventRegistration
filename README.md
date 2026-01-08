# Activity 10: Event Registration & QR Scanner System

A complete event management platform with role-based access (Admin, Organizer, Attendee), automatic QR code ticket generation, and real-time check-in verification.

## 🎯 Project Overview

This is a full-stack event registration system that enables:
- **Admin**: Create/manage events, view all registrations, export reports
- **Organizer**: Check attendees in with QR code scanner, manage event details
- **Attendee**: Browse events, register, receive QR tickets, download tickets

## 📁 Project Structure

```
Activity10-EventRegistration/
├── backend/
│   ├── src/
│   │   ├── events/
│   │   │   ├── event.entity.ts
│   │   │   ├── event.service.ts
│   │   │   ├── event.controller.ts
│   │   │   └── event.module.ts
│   │   ├── registrations/
│   │   │   ├── registration.entity.ts
│   │   │   ├── registration.service.ts
│   │   │   ├── registration.controller.ts
│   │   │   └── registration.module.ts
│   │   ├── tickets/
│   │   │   ├── ticket.entity.ts
│   │   │   ├── ticket.service.ts
│   │   │   ├── ticket.controller.ts
│   │   │   └── ticket.module.ts
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   └── dto.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
├── frontend/
│   ├── admin/
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   └── App.css
│   │   ├── public/
│   │   │   └── index.html
│   │   └── package.json
│   ├── organizer/
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   └── App.css
│   │   ├── public/
│   │   │   └── index.html
│   │   └── package.json
│   ├── attendee/
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   └── App.css
│   │   ├── public/
│   │   │   └── index.html
│   │   └── package.json
│   └── api.ts
└── README.md
```

## 🔧 Technologies

- **Backend**: NestJS 10.3.0, TypeORM 0.3.18, SQLite3, TypeScript 5.3.3
- **Frontend**: React 18.2.0, Axios 1.6.2, react-icons 4.12.0
- **API Documentation**: Swagger/OpenAPI
- **QR Code**: qrcode library 1.5.3
- **UUID**: uuid library 9.0.0

## 📊 Database Schema

### Events Table
```sql
- id (PK)
- title
- description
- date
- time
- location
- capacity
- registrationCount (auto-updated)
- status (pending/active/completed)
- organizerId
- createdAt
- updatedAt
- relationships: OneToMany → Registrations, Tickets
```

### Registrations Table
```sql
- id (PK)
- eventId (FK)
- userId
- status (registered/cancelled)
- userEmail
- userName
- registeredAt
- UNIQUE constraint: (eventId, userId) - prevents duplicate registrations
- relationships: ManyToOne → Events
```

### Tickets Table
```sql
- id (PK)
- eventId (FK)
- registrationId (FK)
- uuid (UNIQUE)
- qrCode (base64 data URL)
- status (active/checked-in/cancelled)
- verified (boolean)
- verifiedAt (timestamp)
- createdAt
- relationships: ManyToOne → Events
```

## 🚀 Installation & Setup

### 1. Backend Setup

```bash
cd Activity10-EventRegistration/backend
npm install
npm run dev
```

Backend runs on `http://localhost:3005`

Swagger API docs available at: `http://localhost:3005/api-docs`

### 2. Admin Dashboard

```bash
cd Activity10-EventRegistration/frontend/admin
npm install
npm start
```

Runs on `http://localhost:3000`

### 3. Organizer Dashboard

```bash
cd Activity10-EventRegistration/frontend/organizer
npm install
npm start
```

Runs on a different port (React will prompt)

### 4. Attendee Portal

```bash
cd Activity10-EventRegistration/frontend/attendee
npm install
npm start
```

Runs on a different port (React will prompt)

## 🔑 Key Features

### Event Management
- Create events with capacity limits
- Automatic capacity enforcement
- Real-time registration count tracking
- Event status management (pending/active/completed)

### Registration System
- Duplicate registration prevention (unique constraint on user + event)
- Automatic ticket generation on registration
- Registration cancellation support
- User session tracking

### QR Ticket System
- Automatic QR code generation using UUID
- Base64-encoded QR code storage (data URL format)
- Ticket verification endpoint for check-in
- Checked-in status tracking with timestamp

### Admin Dashboard
- View all events
- Manage event details
- View all registrations per event
- Export registration data to CSV
- Delete events and manage attendees
- Real-time statistics

### Organizer Dashboard
- Check attendees in with QR scanner
- Manual UUID entry for verification
- Real-time check-in statistics
- View attendee list
- Export attendee report to CSV
- Track verified vs pending attendees

### Attendee Portal
- Browse all available events
- View event capacity in real-time
- Register for events
- View registered events
- Download QR tickets
- Check checked-in status
- Session-based user identification

## 📡 API Endpoints

### Events
```
POST   /events              - Create event
GET    /events              - List all events
GET    /events/:id          - Get event details
PUT    /events/:id          - Update event
DELETE /events/:id          - Delete event
GET    /events/:id/capacity - Get available capacity
```

### Registrations
```
POST   /registrations/events/:eventId/register - Register user
GET    /registrations/events/:eventId           - Get event registrations
GET    /registrations/users/:userId             - Get user registrations
GET    /registrations/:id                       - Get registration details
DELETE /registrations/:id                       - Cancel registration
GET    /registrations/events/:eventId/count     - Get registration count
```

### Tickets
```
POST   /tickets/generate                  - Generate ticket
GET    /tickets/uuid/:uuid                - Get ticket by UUID
GET    /tickets/registration/:regId       - Get ticket by registration
GET    /tickets/events/:eventId           - Get event tickets
POST   /tickets/verify                    - Verify ticket (check-in)
```

## 🔄 Workflows

### Registration Flow
1. Attendee selects event from browse page
2. System checks capacity (prevents registration if full)
3. Creates Registration record with unique constraint on (userId, eventId)
4. Automatically generates Ticket with UUID and QR code
5. Attendee downloads ticket with QR code

### Check-In Flow
1. Organizer opens scanner page
2. Scans QR code or enters UUID manually
3. System verifies ticket and marks as checked-in
4. Timestamp recorded for audit trail
5. Real-time statistics updated

### Data Export Flow
1. Admin/Organizer selects event
2. Clicks export button
3. Generates CSV with all attendee data
4. Browser downloads file automatically

## 🛡️ Validation & Constraints

### Registration Validation
- **Duplicate Prevention**: UNIQUE constraint on (eventId, userId)
- **Capacity Enforcement**: Registration fails if event at capacity
- **Required Fields**: title, date, location for events
- **Email Validation**: Via class-validator in DTOs

### Ticket Validation
- **UUID Uniqueness**: Each ticket has unique UUID
- **Status Check**: Can only verify active, non-verified tickets
- **Timestamp Tracking**: Verification timestamp recorded

## 📝 Example Usage

### Create Event (Admin)
```json
POST /events
{
  "title": "Tech Conference 2024",
  "description": "Annual tech conference",
  "date": "2024-06-15",
  "time": "09:00",
  "location": "Convention Center",
  "capacity": 500,
  "organizerId": 1
}
```

### Register for Event (Attendee)
```json
POST /registrations/events/1/register
{
  "userId": 123,
  "userEmail": "user@example.com",
  "userName": "John Doe"
}
```

### Verify Ticket (Organizer)
```json
POST /tickets/verify
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000"
}
```

## 🎨 UI Features

### Admin Dashboard
- Event card layout with quick stats
- Expandable event details
- Registration table with inline data
- CSV export functionality
- Form modal for creating events
- Delete confirmation dialog

### Organizer Dashboard
- Sidebar with event list and attendance stats
- Large scanner input for manual entry
- Real-time verification feedback
- Attendance summary statistics
- Scrollable attendee list
- Badge system for checked-in status

### Attendee Portal
- Tabbed interface (Browse / My Tickets)
- Event grid with filtering
- Capacity progress bars
- QR code download functionality
- Responsive mobile design
- User session display

## 🔒 Security Features

- CORS enabled for cross-origin requests
- Input validation via class-validator
- Unique constraints prevent data duplication
- Capacity enforcement prevents overbooking
- UUID-based ticket identification (non-sequential IDs)
- Base64 QR codes (no external image hosting)

## 🚨 Error Handling

- Event not found: 404 NotFoundException
- Duplicate registration: 400 BadRequestException
- Event full: 400 BadRequestException
- Already verified ticket: 400 BadRequestException
- Invalid ticket: 404 NotFoundException

## 📊 Future Enhancements

- WebSocket support for real-time updates
- Camera-based QR code scanning in organizer dashboard
- Email notifications for registration confirmation
- Payment integration for ticketed events
- Waitlist management
- Event templates
- Bulk user import
- Advanced reporting and analytics
- Role-based access control (RBAC)
- Two-factor authentication

## 📋 Testing the System

1. **Backend**: Start backend server (http://localhost:3005)
2. **Admin**: Create test events
3. **Attendee**: Register for events and download tickets
4. **Organizer**: Use UUID to verify tickets and check attendees in
5. **Admin**: Export registration data

## 🐛 Troubleshooting

**Backend won't start**
- Ensure port 3005 is available
- Delete existing `event-registration.db` if schema issues occur
- Run `npm install` in backend folder

**Frontend can't connect to API**
- Verify backend is running on port 3005
- Check CORS configuration in app.module.ts
- Look for network errors in browser console

**QR codes not displaying**
- Ensure `qrcode` package is installed
- QR codes are base64 data URLs, check browser console for encoding errors

## 📄 License

MIT License - Feel free to use for educational purposes
