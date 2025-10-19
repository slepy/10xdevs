# BlindInvest

A cutting-edge MVP designed to simplify the investment process by aggregating offers from multiple platforms. BlindInvest helps investors easily browse, evaluate, and commit to investment opportunities while providing administrators with full control over offers and investments.

## Table of Contents

- [Project Name](#project-name)
- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Name

BlindInvest

## Project Description

BlindInvest is an MVP web application that streamlines the investment process. It aggregates investment opportunities from various sources, allowing investors to quickly review and commit to investments while enabling administrators to manage offers, user registrations, and the overall investment lifecycle. With a focus on performance, security, and a seamless user experience, BlindInvest provides both investors and administrators with a robust and intuitive platform.

## Tech Stack

- **Astro 5** – A fast, content-focused web framework.
- **React 19** – For dynamic, interactive UI components.
- **TypeScript 5** – For static type checking and improved code quality.
- **Tailwind CSS 4** – Utility-first CSS framework for efficient styling.
- **Shadcn/ui** – Pre-built, accessible UI components.
- **Supabase** – Backend-as-a-Service for authentication, database, and storage.

### Testing

- **Vitest** – Modern, fast test runner with excellent Vite/Astro integration for unit and integration tests.
- **React Testing Library** – Testing React components the way users interact with them.
- **Playwright** – End-to-end testing framework for simulating real user workflows across browsers.
- **Mock Service Worker (MSW)** – API mocking library for integration tests.
- **@axe-core/react** – Accessibility testing integrated with React Testing Library.

## Getting Started Locally

1. **Prerequisites**:
   - Ensure you have [Node.js](https://nodejs.org/) installed. Refer to the `.nvmrc` file for the preferred Node.js version.

2. **Clone the repository**:

   ```sh
   git clone https://github.com/slepy/10xdevs.git
   cd 10xdevs
   ```

3. **Install dependencies**:

   ```sh
   npm install
   ```

4. **Run the development server**:

   ```sh
   npm run dev
   ```

5. **Build for production**:

   ```sh
   npm run build
   ```

6. **Preview the production build**:

   ```sh
   npm run preview
   ```

## Available Scripts

- **dev**: Start the Astro development server.
- **build**: Create a production build.
- **preview**: Preview the production build locally.
- **lint**: Run ESLint to analyze code quality.
- **lint:fix**: Automatically fix lint issues.
- **format**: Format code using Prettier.
- **test**: Run unit and integration tests with Vitest.
- **test:watch**: Run tests in watch mode.
- **test:coverage**: Generate test coverage report.
- **test:e2e**: Run end-to-end tests with Playwright.
- **test:e2e:ui**: Run E2E tests with Playwright UI mode.

## Project Scope

The current MVP of BlindInvest includes:

- **Authentication**: Registration and login functionality for both investors and administrators.
- **User Management**: Administrators can view and manage registered users.
- **Offer Management**: Administrators can create, edit, and manage investment offers.
- **Investment Process**: Investors can browse offers and submit investment declarations.
- **Investment Tracking**: Both investors and administrators can monitor the status of investments.
- **Document Management**: Administrators can attach and manage documents related to investments.

## Project Status

The project is currently in the **MVP** stage, making it ready for initial user testing and iterative development based on feedback.

## License

This project is licensed under the **MIT License**.
