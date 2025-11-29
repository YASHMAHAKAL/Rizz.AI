# Rizz.AI - Your AI Dating Wingman 💘

Rizz.AI is a next-generation dating assistant powered by Google's Gemini AI. It helps you craft the perfect responses, generate pickup lines, and analyze conversation vibes with a premium, "Romantic Minimalist" aesthetic. by yash mahakal.

![Rizz.AI Banner](https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?q=80&w=3786&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)

## ✨ Features

- **🤖 AI-Powered Rizz**: Leverages Google's Gemini API to generate witty, charming, and context-aware responses.
- **🔒 Secure Architecture**: Uses a Backend-for-Frontend (BFF) pattern to keep API keys safe and secure.
- **🎨 Modern UI**: A stunning interface featuring glassmorphism, fluid animations, and a "Romantic Minimalist" color palette.
- **⚡ Interactive Elements**: Experience a "living" UI with typewriter text effects, 3D card tilts, magnetic buttons, and confetti blasts.
- **� Cloud Ready**: Fully containerized with Docker and ready for Kubernetes deployment.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express
- **AI**: Google Gemini API
- **Infrastructure**: Docker, Kubernetes, Nginx

## 🚀 Getting Started

### Prerequisites

- Docker
- Kubernetes Cluster (Minikube, Kind, or Cloud Provider)
- A Google Gemini API Key

### 📦 Installation & Deployment

1.  **Clone the repository**

    ```bash
    git clone https://github.com/YASHMAHAKAL/rizz.ai.git
    cd rizz.ai
    ```

2.  **Create the Kubernetes Secret**

    You must create a secret to store your API key securely in the cluster.

    ```bash
    kubectl create secret generic rizz-secret --from-literal=api-key=YOUR_ACTUAL_API_KEY_HERE
    ```

3.  **Build the Docker Images**

    If you are using Minikube, point your shell to Minikube's Docker daemon first:
    ```bash
    eval $(minikube docker-env)
    ```

    Build the Backend:
    ```bash
    cd backend
    docker build -t rizz-backend:latest .
    cd ..
    ```

    Build the Frontend:
    ```bash
    cd rizz-app
    docker build -t rizz-ai:latest .
    cd ..
    ```

4.  **Deploy to Kubernetes**

    ```bash
    # Deploy Backend
    kubectl apply -f backend-deployment.yaml

    # Deploy Frontend
    kubectl apply -f rizz-pod.yaml
    ```

5.  **Access the Application**

    If using Minikube:
    ```bash
    minikube service rizz-service
    ```

## 📂 Project Structure

```
rizz.ai/
├── backend/                # Node.js Backend (Handles API Key & Gemini Calls)
│   ├── server.js
│   └── Dockerfile
├── rizz-app/               # React Frontend
│   ├── src/
│   ├── public/
│   └── Dockerfile
├── rizz-pod.yaml           # Frontend Kubernetes Manifest
├── backend-deployment.yaml # Backend Kubernetes Manifest
└── README.md
```

## 🔒 Security

This project uses a secure **Backend-for-Frontend** architecture.
- The **Frontend** (React) never sees the API key. It sends requests to the Backend via an Nginx proxy (`/api/...`).
- The **Backend** (Node.js) holds the API key in a secure environment variable injected by Kubernetes Secrets.
- The **API Key** is stored in Kubernetes `etcd` (encrypted) and is never committed to the repository.
