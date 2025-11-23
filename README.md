# Rizz.AI - Your AI Dating Wingman 💘

Rizz.AI is a next-generation dating assistant powered by Google's Gemini AI. It helps you craft the perfect responses, generate pickup lines, and analyze conversation vibes with a premium, "Romantic Minimalist" aesthetic.

![Rizz.AI Banner](https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?q=80&w=3786&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)

## ✨ Features

- **🤖 AI-Powered Rizz**: Leverages Google's Gemini API to generate witty, charming, and context-aware responses.
- **🎨 Modern UI**: A stunning interface featuring glassmorphism, fluid animations, and a "Romantic Minimalist" color palette.
- **⚡ Interactive Elements**: Experience a "living" UI with typewriter text effects, 3D card tilts, magnetic buttons, and confetti blasts.
- **📱 Mobile-First Design**: Fully responsive layout optimized for mobile devices, ensuring you have backup wherever you go.
- **🌊 Fluid Transitions**: Seamless page transitions and micro-interactions powered by Framer Motion.

## 🛠️ Tech Stack

- **Frontend Framework**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) & [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)
- **AI Integration**: [Google Gemini API](https://ai.google.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Google Gemini API Key

### Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/yourusername/rizz.ai.git
    cd rizz.ai
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Set up Environment Variables**

    Create a `.env` file in the root directory and add your Gemini API key:

    ```env
    VITE_GEMINI_API_KEY=your_api_key_here
    ```

4.  **Run the Development Server**

    ```bash
    npm run dev
    ```

    Open your browser and navigate to `http://localhost:5173` (or the port shown in your terminal).

## 📂 Project Structure

```
rizz.ai/
├── src/
│   ├── components/   # Reusable UI components (Card, Navbar, Typewriter, etc.)
│   ├── context/      # React Context for state management (RizzContext)
│   ├── pages/        # Application pages (Home, Chat, Profile)
│   ├── services/     # API services (Gemini AI integration)
│   ├── App.tsx       # Main application component
│   └── main.tsx      # Entry point
├── public/           # Static assets
└── ...config files   # Tailwind, Vite, TypeScript configs
```

