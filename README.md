# Media Streaming Tester UI

This project is a web-based user interface for testing streaming protocols and services. Built with **React**, **TypeScript**, and **Vite**, it provides tools for configuring, running, and analyzing various RTP and SIP tests.

## Features

- Modular form components for different test types (RTP, SIP)
- Authentication and protected routes
- Context-based state management
- Responsive layout and sidebar navigation
- JSON response viewers and editors

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository or download the source code.
2. Open a terminal in the project directory.
3. Install dependencies:

   ```bash
   npm install
   ```

### Running the Development Server

Start the app in development mode:

```bash
npm run dev
```

This will launch the Vite development server. By default, the app will be available at [http://localhost:3000](http://localhost:3000) or the port shown in your terminal.

## Project Structure

- `src/components/` – UI components grouped by feature
- `src/contexts/` – React context providers for global state
- `src/hooks/` – Custom React hooks
- `src/services/` – API and service logic
- `src/types/` – TypeScript type definitions
