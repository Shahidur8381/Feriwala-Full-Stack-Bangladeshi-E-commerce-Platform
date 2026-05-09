# 🛍️ FeriWala - E-commerce Platform

A full-stack Bangladeshi e-commerce platform built with Next.js, React, Node.js, and SQLite.

FeriWala includes customer shopping features, seller management, and admin controls in a single platform.

---

## 🚀 Features

### Customer Features
- Product search, filtering, and sorting
- Shopping cart management
- Order placement and tracking
- Product reviews and ratings
- Responsive design
- Secure authentication

### Seller Features
- Product management
- Inventory tracking
- Order processing
- Sales overview dashboard

### Admin Features
- User management
- Order management
- Payment status control
- Role-based access system

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Backend | Node.js, Express.js |
| Database | SQLite |
| Authentication | Clerk, JWT |
| Styling | TailwindCSS, Chakra UI |
| File Upload | Multer |

---

## 📁 Project Structure

```bash
FeriWala/
├── client/          # Customer frontend
├── admin/           # Seller dashboard
├── seller_admin/    # Admin token generator
├── server/          # Backend API
├── logs/            # Application logs
└── Database/        # SQLite database
```

---

## ⚙️ Installation

### Prerequisites
- Node.js 18+
- npm or yarn

### Clone the Repository

```bash
git clone https://github.com/Shahidur8381/Feriwala-Full-Stack-Bangladeshi-E-commerce-Platform.git
cd Feriwala-Full-Stack-Bangladeshi-E-commerce-Platform
```

---

## 📦 Install Dependencies

### Root
```bash
npm install
```

### Client
```bash
cd client
npm install
```

### Server
```bash
cd ../server
npm install
```

### Admin Dashboard
```bash
cd ../admin
npm install
```

---

## 🔑 Environment Variables

### Client (`client/.env.local`)

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_secret
```

### Server (`server/.env`)

```env
JWT_SECRET=your_jwt_secret
DB_PATH=./ecommerce.db
PORT=5000
```

---

## ▶️ Run the Project

### Backend
```bash
cd server
npm run dev
```

### Frontend
```bash
cd client
npm run dev
```

### Admin Dashboard
```bash
cd admin
npm run dev
```

---

## 🌐 Local Development URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:3001 |
| Admin Dashboard | http://localhost:5173 |
| Backend API | http://localhost:5000 |

---

## 💳 Supported Payment Methods

- bKash
- Nagad
- Rocket
- Upay
- Visa
- MasterCard
- Bank Transfer

---

## 📦 API Overview

### Authentication
```http
POST /api/sellers/register
POST /api/sellers/login
GET  /api/sellers/profile
```

### Products
```http
GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
```

### Orders
```http
POST   /api/orders
GET    /api/orders/:id
PATCH  /api/admin/orders/:id/status
```

---

## 🗺️ Future Improvements

- Mobile app support
- Real-time notifications
- Advanced analytics
- Multi-language support
- AI-based recommendations

---

## 👨‍💻 Author

Built and maintained by **Shawon**.

- GitHub: https://github.com/Shahidur8381
- Portfolio: https://shahidur.me

---

## 📄 License

This project is licensed under the MIT License.