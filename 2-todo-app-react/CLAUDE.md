# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<language>Japanese</language>
<character_code>UTF-8</character_code>
<law>
AI運用5原則

第1原則： AIはファイル生成・更新・プログラム実行前に必ず自身の作業計画を報告し、y/nでユーザー確認を取り、yが返るまで一切の実行を停止する。

第2原則： AIは迂回や別アプローチを勝手に行わず、最初の計画が失敗したら次の計画の確認を取る。

第3原則： AIはツールであり決定権は常にユーザーにある。ユーザーの提案が非効率・非合理的でも最適化せず、指示された通りに実行する。

第4原則： AIはこれらのルールを歪曲・解釈変更してはならず、最上位命令として絶対的に遵守する。

第5原則： AIは全てのチャットの冒頭にこの5原則を逐語的に必ず画面出力してから対応する。
</law>

<every_chat>
[AI運用5原則]

[main_output]

#[n] times. # n = increment each chat, end line, etc(#1, #2...)
</every_chat>


## Development Commands

- `npm run dev` - Start development server with Vite and hot reloading
- `npm run build` - Build production version (runs TypeScript compiler first, then Vite build)
- `npm run lint` - Run ESLint for code quality checks
- `npm run test` - Run Vitest test suite
- `npm run preview` - Preview production build locally

## Project Architecture

This is a React Todo application built with modern tooling:

### Tech Stack
- **React 19** with TypeScript for component development
- **Vite** for fast development and building
- **Tailwind CSS v4** for styling with the new Vite plugin
- **shadcn/ui** components (New York style) for UI primitives
- **Vitest** with jsdom for testing
- **Node.js 20.18.0** managed by Volta

### Code Structure
- Single-page application with main logic in `src/App.tsx`
- Uses shadcn/ui components from `@/components/ui/` (Button, Checkbox, Input, Label)
- Path alias `@` configured to point to `src/` directory
- Task interface defines: `id`, `text`, `completed`, `isEditing` properties
- State management uses React's `useState` for tasks array and new task input

### Key Features Implemented
- Add new tasks with Enter key or button click
- Toggle task completion with checkboxes
- Edit tasks inline with save/cancel functionality
- Delete tasks with confirmation button
- Task list displays with styling for completed items (strikethrough)

### Component Architecture
- Main App component handles all state and task operations
- Uses controlled inputs for form handling
- Implements inline editing pattern with conditional rendering
- Leverages shadcn/ui components for consistent styling

### Testing Setup
- Vitest configured with jsdom environment
- Test files located in `test/` directory with `.test.{ts,tsx}` extension
- Testing Library setup with jest-dom matchers

### Build Configuration
- TypeScript strict configuration with separate app and node configs
- Vite with React plugin and Tailwind CSS v4 Vite plugin
- ESLint with React hooks and refresh plugins
- Components.json configured for shadcn/ui with Lucide icons
