# Todo App - React + TypeScript + Vite

A modern Todo application built with React 19, TypeScript, and Vite. Features a beautiful UI with Tailwind CSS, comprehensive task management, and automated code quality tools.

## Features

- ✨ **Modern UI**: Beautiful design with Tailwind CSS v4 and shadcn/ui components
- 📝 **Task Management**: Create, edit, delete, and toggle tasks with inline editing
- 🔍 **Filtering**: Filter tasks by all, active, or completed status
- 📊 **Progress Tracking**: Visual progress bar and task counters
- 💾 **Local Storage**: Automatic task persistence
- 🎨 **Responsive Design**: Works on all device sizes
- 🔧 **Type Safety**: Full TypeScript support with strict configuration
- 🚀 **Fast Development**: Vite for lightning-fast HMR
- 🧪 **Testing**: Comprehensive test suite with Vitest and Testing Library
- 🔍 **Code Quality**: ESLint, Biome.js for formatting and linting
- 🚀 **CI/CD**: GitHub Actions for automated testing

## Tech Stack

- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Tailwind CSS v4** - Utility-first CSS framework
- **shadcn/ui** - High-quality UI components
- **Vitest** - Fast unit testing
- **Biome.js** - Fast formatter and linter
- **GitHub Actions** - CI/CD pipeline

## Getting Started

### Prerequisites

- Node.js 20.18.0 (managed by Volta)
- npm

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd 2-todo-app-react
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

## Available Scripts

### Development
- `npm run dev` - Start development server with hot reloading
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

### Testing
- `npm test` - Run test suite in watch mode
- `npm run test:ci` - Run tests once (for CI)

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:biome` - Run Biome linter
- `npm run format` - Format code with Biome
- `npm run format:check` - Check code formatting
- `npm run check` - Run comprehensive checks (format + lint)
- `npm run check:fix` - Run checks and auto-fix issues

## Architecture

### Component Structure
- `src/App.tsx` - Main application component
- `src/components/` - Reusable UI components
- `src/components/ui/` - Base UI components (Button, Input, etc.)
- `src/hooks/` - Custom React hooks
- `src/types/` - TypeScript type definitions
- `src/lib/` - Utility functions

### Key Features
- **Task Management**: Full CRUD operations with local storage persistence
- **Filtering**: Dynamic task filtering (All, Active, Completed)
- **Inline Editing**: Edit tasks directly in the list
- **Progress Tracking**: Real-time progress visualization
- **Responsive Design**: Mobile-first approach

## Testing

The application includes comprehensive tests using:
- **Vitest** - Fast test runner
- **Testing Library** - Component testing utilities
- **jsdom** - DOM testing environment

Run tests with:
```bash
npm test
```

## Code Quality

### Biome.js Configuration
- **Formatting**: Consistent code style with single quotes, semicolons
- **Linting**: Comprehensive rules for security, performance, and best practices
- **Import Organization**: Automatic import sorting and optimization

### ESLint Configuration
- **React Rules**: React-specific linting rules
- **TypeScript**: Type-aware linting
- **Accessibility**: a11y compliance checks

## CI/CD

GitHub Actions workflow automatically:
- Runs on pull requests to main branch
- Installs dependencies
- Runs linting checks
- Executes test suite
- Builds the application

## Deployment

The application is optimized for deployment to:
- **Vercel** (recommended)
- **Netlify**
- **GitHub Pages**

Build artifacts are generated in the `dist/` directory.

### Vercel Deployment Commands

```bash
# ログイン
vercel login

# プロジェクトリスト確認
vercel project list

# 今いるフォルダにプロジェクト作成
vercel pull

# preview環境デプロイ
vercel build
vercel deploy --prebuilt

# 本番デプロイ
vercel deploy --prebuilt --prod
vercel build --prod
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run code quality checks (`npm run check:fix`)
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

This project is licensed under the MIT License.
