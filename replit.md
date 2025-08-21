# Healthcare EHR System

## Overview

This is a modern Healthcare Electronic Health Records (EHR) system built with a full-stack TypeScript architecture. The application provides real-time patient monitoring, lab results management, AI-powered healthcare insights, and clinical forecasting capabilities. It features a dashboard-centric design for healthcare professionals to monitor patients, track vital signs, manage lab results, and receive AI-driven recommendations for clinical decision-making.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom healthcare-themed color variables
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket integration for live data updates

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with real-time WebSocket endpoints
- **Development Setup**: tsx for development server with hot reloading
- **Production Build**: esbuild for server bundling

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Connection pooling with @neondatabase/serverless

### Database Schema Design
The system uses a comprehensive healthcare data model including:
- **Patients**: Core patient information with medical record numbers
- **Vital Signs**: Real-time monitoring data (heart rate, blood pressure, temperature, oxygen saturation)
- **Lab Results**: Laboratory test results with status tracking and reference ranges
- **Alerts**: Healthcare alerts with severity levels and acknowledgment tracking
- **AI Insights**: Machine learning-generated clinical insights and recommendations

### Authentication and Authorization
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple
- **Security**: CORS-enabled API with express security middleware

### Real-time Features
- **WebSocket Server**: Custom WebSocket implementation for live data streaming
- **Event Broadcasting**: Real-time updates for vital signs, lab results, and alerts
- **Connection Management**: Auto-reconnection and connection status monitoring

### AI Integration
- **AI Service**: OpenAI GPT-4o integration for healthcare analytics
- **Clinical Analysis**: Automated patient data analysis and risk assessment
- **Predictive Insights**: AI-powered recommendations and clinical forecasting
- **Natural Language Processing**: Structured JSON responses for clinical insights

### Development Environment
- **Package Management**: npm with lockfile for reproducible builds
- **Type Safety**: Comprehensive TypeScript configuration with strict mode
- **Code Quality**: ESLint and Prettier configuration (implied by structure)
- **Development Tools**: Vite with HMR, runtime error overlay, and Replit integration

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18+ with React DOM and React Query for state management
- **Express.js**: Web framework with middleware for JSON parsing and CORS
- **Vite**: Build tool with React plugin and development server capabilities

### Database and ORM
- **Drizzle ORM**: Type-safe database operations with PostgreSQL dialect
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Database Session Store**: PostgreSQL session storage for authentication

### UI and Styling
- **Radix UI**: Comprehensive set of accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom healthcare theme
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Utility for managing component variants

### Real-time and Communication
- **WebSocket (ws)**: Native WebSocket implementation for real-time features
- **TanStack Query**: Server state management with caching and synchronization

### AI and Analytics
- **OpenAI SDK**: Integration with GPT-4o for healthcare analytics and insights
- **Recharts**: Data visualization library for healthcare analytics charts

### Development and Build Tools
- **TypeScript**: Type safety across frontend and backend
- **tsx**: TypeScript execution for development
- **esbuild**: Fast bundling for production builds
- **PostCSS**: CSS processing with Tailwind CSS integration

### Utility Libraries
- **date-fns**: Date manipulation and formatting
- **zod**: Runtime type validation with Drizzle integration
- **clsx**: Conditional CSS class management
- **nanoid**: Unique ID generation for entities

### Form and Validation
- **React Hook Form**: Form state management with validation
- **Hookform Resolvers**: Integration between React Hook Form and validation libraries

The system is designed for scalability and maintainability, with clear separation of concerns between frontend components, backend services, and data persistence layers. The real-time architecture ensures healthcare professionals receive immediate updates on patient status changes and critical alerts.