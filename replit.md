# MeraDhan CRM - Online Bond Provider Platform

## Overview

MeraDhan CRM is a production-grade, horizontally scalable Customer Relationship Management application for an Online Bond Provider Platform (OBPP) in India. The application is built using a modern full-stack TypeScript architecture with a focus on security, scalability, and compliance with SEBI regulations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **Authentication**: JWT-based stateless authentication with OTP verification
- **Email Service**: Nodemailer for OTP delivery and notifications

### Database Design
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Connection**: Neon serverless PostgreSQL for scalability
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Key Tables**: users, leads, customers, rfqs, support_tickets, email_templates, otps, login_logs, activity_logs

## Key Components

### Authentication System
- **OTP-based Login**: Email-only authentication without passwords
- **Role-Based Access Control**: Admin, Sales, Support, Relationship Manager (RM), Viewer roles
- **Session Management**: JWT tokens for stateless horizontal scaling
- **Security Features**: Login history tracking, IP and user-agent logging, OTP expiration
- **Admin Protection**: Main admin account (vikas.kukreja@meradhan.co) cannot be deactivated for system security

### CRM Modules
1. **Dashboard**: Interactive charts and KPI widgets using Recharts
2. **Lead Management**: Lead capture, tracking, and conversion pipeline
3. **Customer Management**: Customer profiles with KYC status tracking
4. **Sales Pipeline**: Visual pipeline management with conversion metrics
5. **RFQ Management**: Request for Quote handling with NSE integration
6. **Support Tickets**: Customer support ticket system with priority management
7. **Email Templates**: Templated communication system
8. **Reports**: Analytics and reporting with data visualization
9. **User Management**: Admin-only user and role management

### UI/UX Design
- **Design System**: Consistent design using Shadcn/ui component library
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Dark/Light Theme**: CSS variables-based theming system
- **Accessibility**: ARIA-compliant components from Radix UI

## Data Flow

### Authentication Flow
1. User enters email address
2. System generates and sends 6-digit OTP via email
3. User enters OTP for verification
4. System validates OTP and generates JWT token
5. JWT token used for subsequent API requests

### Lead to Customer Conversion
1. Lead captured through various sources (website, referral, etc.)
2. Lead assigned to sales representative
3. Lead qualification and follow-up process
4. Lead conversion to customer with KYC completion
5. Customer onboarding and relationship management

### RFQ Process
1. Customer submits Request for Quote
2. Internal processing and validation
3. Submission to NSE platform
4. Quote execution and settlement tracking

## External Dependencies

### Core Dependencies
- **Database**: @neondatabase/serverless for PostgreSQL connection
- **ORM**: drizzle-orm for database operations
- **Authentication**: jsonwebtoken for JWT handling
- **Email**: nodemailer for SMTP email delivery
- **UI Components**: @radix-ui/* for accessible component primitives
- **Charts**: recharts for data visualization
- **Forms**: react-hook-form with @hookform/resolvers for validation

### Development Dependencies
- **Build**: Vite for frontend bundling, esbuild for backend bundling
- **TypeScript**: Full TypeScript support across frontend and backend
- **Validation**: Zod for runtime type validation
- **Styling**: Tailwind CSS with PostCSS

### Third-party Integrations
- **Email Service**: SMTP-based email delivery (configurable provider)
- **NSE Platform**: Mock integration for bond trading (RFQ submission)
- **Database Hosting**: Neon serverless PostgreSQL

## Deployment Strategy

### Development Environment
- **Local Development**: tsx for TypeScript execution in development
- **Hot Reload**: Vite HMR for frontend, tsx watch mode for backend
- **Database**: Drizzle Kit for schema management and migrations

### Production Build
- **Frontend**: Vite production build with optimization
- **Backend**: esbuild bundling for Node.js deployment
- **Database**: Environment-based connection strings for different stages

### Scalability Features
- **Stateless Backend**: JWT-based authentication for horizontal scaling
- **Database Connection Pooling**: Neon serverless with connection pooling
- **CDN-Ready**: Static asset optimization for CDN deployment
- **Environment Configuration**: Environment-based configuration for different deployment stages

### Security Measures
- **Input Validation**: Zod schemas for API request validation
- **SQL Injection Protection**: Drizzle ORM parameterized queries
- **CORS Configuration**: Proper CORS setup for API security
- **Rate Limiting**: Prepared for rate limiting implementation
- **Audit Trail**: Comprehensive logging for compliance requirements

The application is designed to be production-ready with proper error handling, type safety, and scalability considerations built into the architecture from the ground up.

## Recent Changes

### July 21, 2025 - IST Timezone Fix
- **Issue Resolved**: Double IST conversion causing timestamps to display 5.5 hours ahead
- **Root Cause**: Frontend was adding timezone offset to already-converted IST times from database
- **Solution Implemented**: 
  - Fixed database schema to allow explicit IST timestamp storage
  - Updated backend to store proper IST times (UTC + 5:30)
  - Added frontend safety checks with 'Z' suffix to prevent browser timezone interference
  - Verified timestamps now display correct IST time matching user's local time
- **Components Fixed**: Session analytics, audit logs, login history, activity tracking
- **Verification**: User confirmed timestamps now match actual IST (15:51 displayed = 15:51 actual)

### July 21, 2025 - Session Management Improvements
- **Session Token Reuse**: Fixed page refresh creating duplicate sessions - now reuses existing tokens
- **Logout Tracking**: Fixed logout events not being recorded - added Authorization header to session-end requests
- **Session Analytics UX**: Removed 5-second auto-refresh per user request to allow uninterrupted scrolling through session history
- **Manual Refresh**: Kept manual refresh button for on-demand updates
- **Session Persistence**: Sessions now properly maintain continuity across page refreshes

### July 22, 2025 - Role-Based Dashboard Activities
- **Privacy Enhancement**: Implemented role-based filtering for recent activities on dashboard
- **Admin Access**: Admin users continue to see all activities from all users
- **Non-Admin Privacy**: Non-admin users (sales, support, RM, viewer) now see only their own activities
- **Data Security**: Prevents unauthorized access to other users' activity information
- **Compliance**: Aligns with data privacy requirements for multi-user CRM systems