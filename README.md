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

3. Set up your environment variables:
   - Copy `example.env` to `.env`
   - Add your Neon database connection string to `DATABASE_URL`
   - Add your Clerk authentication keys
   - Add your Gemini API key for AI code analysis

   ### Dev / Test credentials
   - You can configure an optional test account for fast local sign-in without needing OTP or email verification (useful for development).
   - Add the following to your `.env` (or `NEXT_PUBLIC_` variants in `example.env`) and set the password locally:

   ```
   NEXT_PUBLIC_TEST_EMAIL=mandalamandeep@gmail.com
   NEXT_PUBLIC_TEST_HANDLE=Eclipse1077
   NEXT_PUBLIC_TEST_PASSWORD=your_local_test_password
   ```

   After setting these, the sign-in page will show a "Use test credentials" button to autofill and submit the form.

4. Set up the database:

   ```bash
   # Push the Prisma schema to your Neon database
   npx prisma db push

   # Generate the Prisma Client
   npx prisma generate
   ```

5. Run the development server:

   ```bash
   bun dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) and sign in with Clerk to start tracking your progress

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

## 🔮 Future Scope

- **Multi-Platform Support**: Expand beyond Codeforces to cover LeetCode and CodeChef problems
- **Code Execution**: Execute code directly within the app with support for multiple programming languages
- **Advanced Progress Tracking**: Track and visualize the number of solved vs. unsolved questions with detailed analytics
- **Premium Features**: Unlock premium tier with advanced features including:
  - Flexible payment methods for subscription management
  - Enhanced AI analysis with more detailed explanations
  - Advanced filtering and sorting options
  - Priority support

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
