# Beacon

**Beacon** is a cross-platform real-time chat application built with a strong focus on **security, performance, and intelligent interactions**. It combines modern full-stack technologies with **Post-Quantum Cryptography (PQC)** and an integrated **AI chatbot** to deliver a next-generation messaging experience.

---

## Links

* **GitHub:** [https://github.com/devangy/Beacon](https://github.com/devangy/Beacon)

---

##  Overview

Beacon is designed to go beyond traditional chat apps by integrating:

* 🔐 **Post-Quantum End-to-End Encryption (E2EE)**
* ⚡ **Real-time messaging with low latency**
* 🤖 **AI-powered conversational assistant (Gemini)**
* 📦 **Containerized deployment with scalable infrastructure**

---

## 🏗️ Architecture


<img width="1679" height="695" alt="image" src="https://github.com/user-attachments/assets/49b0d473-3a42-4580-9f9a-d588057f2e2e" />




### High-Level Flow

1. **Client (React Native)**

   * Handles UI, state management, and real-time socket communication
2. **Backend (Node.js + Socket.io)**

   * Manages messaging, authentication, and encryption workflows
3. **Database (PostgreSQL + Prisma)**

   * Stores user data, messages, and metadata
4. **AI Layer (Gemini API)**

   * Processes chatbot queries with persona-based prompting
5. **Infrastructure**

   * Dockerized services deployed via VPS
   * Cloudflare Tunnel for secure exposure

---

## ⚙️ Tech Stack

### 📱 Frontend

* React Native (Cross-platform mobile app)
* Redux (Global state management)
* React Query (Server-state caching & data fetching)

### 🌐 Backend

* Node.js
* Socket.io (Real-time communication)

### 🗄️ Database

* PostgreSQL
* Prisma ORM

### 🔐 Security

* Post-Quantum Cryptography:

  * **ML-KEM (Kyber)** (NIST standard)
* Symmetric Encryption:

  * **AES-256-GCM** (Authenticated encryption)
* OAuth 2.0 Authentication

### 🤖 AI Integration

* Gemini AI (Persona-based chatbot)

### ☁️ DevOps & Deployment

* Docker & Docker Compose
* Cloudflare Tunnel
* VPS Hosting
* CI/CD (GitHub Actions)
* Centralized Logging

---

## 🔐 Key Features

### 🔑 Post-Quantum Secure Messaging

* Implements **ML-KEM (Kyber)** for quantum-resistant key exchange
* Uses **AES-256-GCM** for secure, authenticated message encryption
* Ensures **End-to-End Encryption (E2EE)**

---

### 💬 Real-Time Chat System

* Built with **Socket.io** for low-latency communication
* Supports:

  * Instant messaging
  * Presence updates
  * Scalable event-driven architecture

---

### 🔐 OAuth-Based Authentication

* Secure login and session handling
* Smooth onboarding experience
* Token-based authentication flow

---

### 🤖 AI Chatbot (Gemini Integration)

* Integrated **Gemini AI** chatbot
* Uses **persona-based prompting**
* Simulates a comedy actor for engaging, dynamic responses

---

### ⚡ Optimized State Management

* **Redux** for global app state
* **React Query** for:

  * Efficient data fetching
  * Caching
  * Background updates

---

### 🐳 Containerized Deployment

* Multi-service architecture using **Docker Compose**
* Secure exposure via **Cloudflare Tunnel**
* Automated deployments with **CI/CD pipelines**
* Centralized logging for monitoring and debugging

---

## 📦 Project Structure

```
Beacon/
├── my-app/             # React Native app
├── api/             # Node.js backend (Socket.io)
├── docker/             # Docker configs
├── .github/workflows/  # CI/CD pipelines
└── assets/             # Images (architecture, etc.)
```

---

## 🚀 Getting Started

### Prerequisites

* Node.js
* Docker & Docker Compose
* PostgreSQL

---

### Installation

```bash
# Clone the repository
git clone https://github.com/devangy/Beacon.git

cd Beacon

# Build Docker image
docker build -t beacon-app .

# Run container
docker run -p 3000:3000 beacon-app
```

---

## 📈 Future Improvements

* 🔊 Real-time voice chat integration
* 📄 AI-powered document interaction (Chat with PDF)
* 🌍 Multi-region deployment
* 🔐 Enhanced key management & rotation
* 📊 Observability (metrics + tracing)

