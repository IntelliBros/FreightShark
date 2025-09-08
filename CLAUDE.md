# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Preview production build
npm run preview
```

## Architecture Overview

This is a freight forwarding management application built with React, TypeScript, and Vite. The application has three distinct user roles with separate dashboards:

### User Roles & Routes
- **Customer Portal** (`/`) - For customers to request quotes, track shipments, manage documents
- **Staff Portal** (`/staff`) - For freight company staff to manage quotes, invoices, and shipments
- **Admin Portal** (`/admin`) - For system administrators to manage users and system settings

### Core Data Flow
1. **Authentication** (`src/context/AuthContext.tsx`) - Manages user sessions and role-based routing. Mock authentication with localStorage persistence.
2. **Data Layer** (`src/services/DataService.ts`) - LocalStorage-based data persistence with simulated network delays. Manages Quote Requests, Quotes, Shipments, and Users.
3. **Global State** (`src/context/DataContext.tsx`) - Provides centralized data access across components with refresh capabilities.

### Key Entity Relationships
- **QuoteRequest** → **Quote** → **Shipment** (lifecycle flow)
- Quote Requests contain destination warehouses (FBA locations) with carton details
- Quotes include per-warehouse rates and additional charges
- Shipments track actual vs estimated weights and real-time status updates

### UI Architecture
- Layout components in `src/components/layout/` handle role-specific navigation
- Pages are organized by feature area under `src/pages/`
- Tailwind CSS for styling with responsive design
- React Router for client-side routing with nested layouts

## Tech Stack
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Context API
- **Data Persistence**: LocalStorage with mock API service layer