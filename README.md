# CF Tracker

A sleek, minimalist Codeforces upsolving companion that helps you manage and conquer unsolved problems from your competitive programming journey.

## ✨ Features

- **Smart Sync**: Automatically fetch all your unsolved Codeforces problems and track questions you need to upsolve — problems you couldn't solve during live contests
- **Full Problem View**: Open any question to see the complete problem statement with examples and constraints, all without leaving the app
- **Integrated Code Editor**: Write solutions directly using Monaco Editor with multi-language support (note: code execution is not supported in the browser)
- **AI Code Analysis**: Stuck on a problem? Get instant feedback on what's wrong with your code and hints on how to fix it
- **Question Management**: Add new questions manually, remove solved ones, and bookmark important problems for quick access
- **Clean UI**: Minimal, fast interface with a dark theme optimized for long coding sessions

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies:

   ```bash
   bun install
   ```

3. Set up your environment variables (copy from `env.example`)

4. Run the development server:

   ```bash
   bun dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) and sign in with Clerk to start tracking your progress

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **Database**: Prisma ORM
- **Authentication**: Clerk
- **Editor**: Monaco Editor
- **Styling**: Tailwind CSS with custom dark theme

## 📦 Project Structure

- `/app` - Next.js app router pages and API routes
- `/components` - Reusable UI components
- `/lib` - Utility functions and hooks
- `/prisma` - Database schema and migrations
- `/utils` - Helper functions for Codeforces API integration

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
