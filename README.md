# Auth Skeleton

![GitHub repo size](https://img.shields.io/github/repo-size/yourusername/your-repo)
![GitHub contributors](https://img.shields.io/github/contributors/yourusername/your-repo)
![GitHub language count](https://img.shields.io/github/languages/count/yourusername/your-repo)
![License](https://img.shields.io/github/license/yourusername/your-repo)
![GitHub stars](https://img.shields.io/github/stars/yourusername/your-repo?style=social)

> Auth Skeleton is a MERN-based authentication template that provides secure user login, registration, and file upload functionality. It serves as a foundation for scalable web applications, enabling quick setup of authentication, authorization, and data handling features.

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Folder Structure](#folder-structure)
- [Contributing](#contributing)
- [License](#license)

---

## Features
- User authentication with JWT
- File upload using Multer
- RESTful API endpoints
- Responsive frontend UI

---

## Tech Stack
- **Frontend:** React, Vite, TailwindCSS  
- **Backend:** Node.js, Express, MongoDB, Mongoose  
- **Authentication:** JWT, bcrypt  
- **Other Tools:** Axios, Nodemailer, Lucide Icons

---

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/your-repo.git
cd your-repo
```
Install dependencies for backend:
```bash
cd Back
npm install
```
Install dependencies for frontend:
```bash
cd ../Front
npm install
```
Create a .env file in the Back folder:
```bash
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
```
Usage
Start backend
```bash
cd Back
npm nodemon
```
Start frontend
```bash
cd Front
npm run dev
```
Folder Structure
```bash
root
├── Back/           # Backend Node.js + Express API
├── Front/          # Frontend React + Vite project
└── README.md
```
---

Contributing
- Fork the repository
- Create a feature branch (git checkout -b feature-name)
- Commit your changes (git commit -m 'Add feature')
- Push to the branch (git push origin feature-name)
- Open a Pull Request
