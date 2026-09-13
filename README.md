# 🏛️ Campus Maintenance Complaint & Redressal System

> An end-to-end full-stack digital platform for reporting, assigning, resolving, verifying, and monitoring maintenance issues across a university campus.

[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Mongoose-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Leaflet](https://img.shields.io/badge/Maps-Leaflet%20%2B%20OSM-199900?logo=leaflet)](https://leafletjs.com/)
[![JWT](https://img.shields.io/badge/Auth-JWT%20Role%20Based-000000?logo=jsonwebtokens)](https://jwt.io/)

---

## 🌟 Key Features

### 🎓 1. Student / Staff Portal
- **Lodge Complaint**:
  - 9 Categories (Plumbing, Electrical, Furniture, AC, IT Equipment, Restroom, Cleanliness, Structural, Other).
  - Priority Level (`Low`, `Medium`, `High`, `Emergency`).
  - **Interactive Leaflet Map**: Click to drop a pin with live GPS coordinates.
  - Image attachment support.
- **Visual Progress Tracking**: Real-time 5-step status stepper (`Lodged` ➔ `Assigned` ➔ `In Progress` ➔ `Resolved` ➔ `Verified & Closed`).
- **Student Redressal Feedback**: Rate service (1-5 ⭐) and leave review notes on closed tickets.

### 👨‍🔧 2. Maintenance Staff Portal
- **Technician Task Queue**: View tickets assigned by Super Admin.
- **Task Lifecycle**: One-click "Start Work (In Progress)".
- **Resolution Proof**: Upload before/after proof photos and submit technician remarks/parts replaced.

### 👨‍💼 3. Super Admin Command Center
- **Live KPI Dashboard**: Total complaints, pending queue, active repairs, and satisfaction rating index.
- **Master Complaints Table**: Multi-filter by Status, Category, Priority, and Search.
- **Technician Allocation Modal**: Inspect technician trade specializations and active task load before assigning.
- **Side-by-Side Proof Verification**: Compare initial issue photo vs. technician's resolution proof photo with Approve or Reject (rework) actions.
- **Staff Directory (`/admin/staff`)**: Manage trade specializations and onboard new technicians.
- **Analytics & BI Metrics (`/admin/analytics`)**: Category distribution bars, priority severity charts, and location breakdown.

---

## 🏗️ Technology Stack

- **Frontend**: React 18, Vite, React Router v6, Leaflet & React-Leaflet, Axios, Vanilla CSS (Glassmorphism design system)
- **Backend**: Node.js, Express.js, JWT, bcrypt, Multer, Multer-Storage-Cloudinary
- **Database**: MongoDB (Mongoose ODM)

---

## 🚀 Quick Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/omsharma2705-ops/CAMPUS-MAINTENANCE-.git
cd CAMPUS-MAINTENANCE-
```

### 2. Backend Setup
```bash
cd backend
npm install
node seeder.js   # Seeds demo users & sample complaints
node index.js    # Runs on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev      # Runs on http://localhost:5173
```

---

## 🔑 Demo Credentials (Auto-fill available on login screen)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@campus.edu` | `admin123` |
| **Electrician Staff** | `worker@campus.edu` | `worker123` |
| **Plumber Staff** | `plumber@campus.edu` | `worker123` |
| **Student** | `student@campus.edu` | `student123` |

---

## 📜 License
MIT License. Built for University Campus Maintenance & Operations.
