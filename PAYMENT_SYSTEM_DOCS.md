# Payment System Implementation

This document describes the complete payment system implementation for the Feriwala ecommerce platform.

## Overview

The payment system allows customers to pay for their orders using various payment methods (bKash, Nagad, Rocket, Upay, Visa, Mastercard) and provides admin/seller interfaces to manage order statuses.

## Features Implemented

### 1. Database Schema Updates

- Added payment fields to orders table:
  - `paymentMethod` (TEXT): Payment method used (bkash, nagad, rocket, upay, visa, mastercard)
  - `paymentAccount` (TEXT): Mobile number or account number
  - `transactionId` (TEXT): Transaction ID from payment
  - `paymentStatus` (TEXT): Payment status tracking

### 2. Order Status System

Enhanced order status with new "pending" status:

- `unpaid` → `pending` → `paid` → `ready_to_ship` → `shipped` → `out_for_delivery` → `delivered`

### 3. Backend Implementation

#### Order Routes (`server/routes/orderRoutes.js`)

- Updated status enum to include "pending"
- Added payment submission endpoint: `POST /:orderId/payment`
- Payment endpoint sets order status to "pending" after payment info submission

#### Admin Routes (`server/routes/adminRoutes.js`)

- Protected with JWT authentication
- `GET /api/admin/orders` - Fetch all orders with payment info
- `PATCH /api/admin/orders/:orderId/status` - Update order status
- Status validation for all valid statuses

### 4. Frontend Implementation

#### Client Frontend (Next.js)

**Payment Page** (`client/src/pages/payment/[orderId].tsx`)

- Dynamic route for order-specific payments
- Payment method selection (bKash, Nagad, Rocket, Upay, Visa, Mastercard)
- Account number input
- Transaction ID input
- Instructions for each payment method
- Redirects to profile after successful payment

**Checkout Updates** (`client/src/pages/checkout.tsx`)

- Redirects to payment page after order placement
- Uses Next.js router for navigation

**Profile Updates** (`client/src/pages/profile/[[...index]].tsx`)

- Shows "Pay Now" button for unpaid orders
- Links to payment page for the specific order
- Updated order status display

**Utilities** (`client/src/utils/orderStatus.ts`)

- Added "pending" status support
- Updated progress calculation
- Status color and label mappings

#### Admin Frontend (Vite + React)

**Orders Management** (`admin/src/pages/Orders.tsx`)

- Complete order management interface
- Order listing with filtering by status
- Order details modal with customer and payment information
- Status update functionality
- Order statistics dashboard
- Responsive design

**Navigation Updates** (`admin/src/App.tsx`)

- Added Orders navigation link
- Protected route for orders page

### 5. Authentication & Security

- Admin routes protected with JWT authentication
- Seller authentication required for order management
- Status validation on backend

## Usage Flow

### Customer Payment Flow

1. Customer places order on checkout page
2. Redirected to payment page (`/payment/[orderId]`)
3. Selects payment method and enters details
4. Submits payment information
5. Order status changes to "pending"
6. Redirected to profile to view order status

### Admin/Seller Management Flow

1. Seller logs into admin panel
2. Navigates to Orders section
3. Views all orders with filtering options
4. Clicks on order to view details
5. Updates order status as payment is verified and order progresses
6. Status updates: pending → paid → ready_to_ship → shipped → out_for_delivery → delivered

## API Endpoints

### Order Routes

- `POST /api/orders/:orderId/payment` - Submit payment information

### Admin Routes (Protected)

- `GET /api/admin/orders` - Get all orders
- `PATCH /api/admin/orders/:orderId/status` - Update order status

## Payment Methods Supported

- **bKash**: Mobile wallet payment
- **Nagad**: Mobile wallet payment
- **Rocket**: Mobile wallet payment
- **Upay**: Mobile wallet payment
- **Visa**: Credit card payment
- **Mastercard**: Credit card payment

## Status Definitions

- **unpaid**: Order placed but no payment submitted
- **pending**: Payment information submitted, awaiting verification
- **paid**: Payment verified by admin/seller
- **ready_to_ship**: Order prepared for shipping
- **shipped**: Order dispatched
- **out_for_delivery**: Order out for delivery
- **delivered**: Order delivered to customer

## Technologies Used

- **Backend**: Node.js, Express.js, SQLite
- **Client Frontend**: Next.js 15, React, TypeScript
- **Admin Frontend**: Vite, React, TypeScript
- **Authentication**: JWT (sellers), Clerk (customers)
- **Styling**: CSS modules, responsive design

## Development Setup

### Starting the servers:

```bash
# Backend server
cd server
npm start

# Client frontend
cd client
npm run dev

# Admin frontend
cd admin
npm run dev
```

### URLs:

- Client: http://localhost:3000
- Admin: http://localhost:5173
- Backend API: http://localhost:5000

## Future Enhancements

- Payment gateway integration for automated verification
- Email notifications for status updates
- SMS notifications for customers
- Payment receipt generation
- Refund management system
- Advanced order analytics and reporting
