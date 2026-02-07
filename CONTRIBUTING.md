# Contributing to NexShop

Thank you for your interest in contributing to NexShop! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Message Convention](#commit-message-convention)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone. Be kind, constructive, and professional in all interactions.

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/your-username/fullstack-ecommerce-platform.git
   cd fullstack-ecommerce-platform
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Fill in your Supabase credentials
   ```
5. **Start the development server:**
   ```bash
   npm run dev
   ```

## Development Workflow

1. Create a new branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes following the [coding standards](#coding-standards)
3. Test your changes locally
4. Commit your changes using the [commit convention](#commit-message-convention)
5. Push to your fork and submit a Pull Request

## Pull Request Process

1. Ensure your code passes all checks:
   ```bash
   npm run typecheck   # TypeScript type checking
   npm run lint         # ESLint
   npm run build        # Production build
   ```
2. Update documentation if your changes affect the public API or user-facing features
3. Fill out the PR template with a clear description of your changes
4. Request review from a maintainer

## Coding Standards

- **Language:** TypeScript (strict mode)
- **Framework:** React 18 with functional components and hooks
- **Styling:** Tailwind CSS with custom design system (brand/surface/accent tokens)
- **State Management:** React Context API
- **Formatting:** Follow the existing code style in the project
- **File Naming:**
  - Components: `PascalCase.tsx` (e.g., `ProductCard.tsx`)
  - Hooks: `camelCase.ts` with `use` prefix (e.g., `useProducts.ts`)
  - Utilities: `camelCase.ts` (e.g., `utils.ts`)
  - Pages: `PascalCase.tsx` with `Page` suffix (e.g., `ShopPage.tsx`)

## Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
```

### Types

| Type       | Description                                   |
| ---------- | --------------------------------------------- |
| `feat`     | A new feature                                 |
| `fix`      | A bug fix                                     |
| `docs`     | Documentation only changes                    |
| `style`    | Code style changes (formatting, semicolons)   |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf`     | Performance improvement                       |
| `test`     | Adding or updating tests                      |
| `chore`    | Build process or auxiliary tool changes       |

### Examples

```
feat(cart): add quantity validation before checkout
fix(auth): resolve session persistence on page refresh
docs(readme): update installation instructions
refactor(hooks): extract product filtering logic
```

---

Thank you for contributing to NexShop! 🚀
