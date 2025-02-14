# Shifterino - 911 Dispatch Center Scheduling System

A modern web application built with Next.js 14, TypeScript, and Supabase for managing 24/7 staffing schedules at 911 dispatch centers.

## Features

- 24/7 schedule management with minimum staffing requirements
- Employee shift pattern management (4x10 or 3x12+4)
- Time-off request handling
- Shift swap management
- Role-based access control (Manager, Supervisor, Dispatcher)
- Real-time updates using Supabase

## Prerequisites

- Node.js 18.17 or later
- Docker Desktop
- Supabase CLI

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/shifterino.git
cd shifterino
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```
Edit `.env.local` with your Supabase credentials.

4. Start Supabase locally:
```bash
supabase start
```

5. Reset the database and apply migrations:
```bash
npm run db:reset
```

6. Create test users:
```bash
npm run create:users
```

7. Start the development server:
```bash
npm run dev
```

## Test Users

The following test users are created by default:

- Manager:
  - Email: manager@dispatch911.com
  - Password: Manager@123

- Supervisor:
  - Email: supervisor1@dispatch911.com
  - Password: Super@123

- Dispatcher:
  - Email: dispatcher1@dispatch911.com
  - Password: Dispatch@123

## Database Schema

The application uses the following main tables:

- employees: Employee profiles and preferences
- assigned_shifts: Scheduled shifts for employees
- time_off_requests: Employee time-off requests
- shift_swap_requests: Shift swap requests between employees
- staffing_requirements: Minimum staffing requirements per time block
- shift_options: Available shift types and times

## Development

- Run tests: `npm test`
- Generate database types: `npm run db:types`
- Lint code: `npm run lint`
- Build for production: `npm run build`

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.