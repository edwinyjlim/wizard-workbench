# PostHog post-wizard report

The wizard has completed a deep integration of your Next.js 15 Todo App project. PostHog has been configured to track user actions, monitor errors, and provide insights into user behavior. The integration uses the modern `instrumentation-client.ts` approach recommended for Next.js 15.3+, with automatic pageview and exception capturing enabled.

## Configuration Files Created

| File | Purpose |
|------|---------|
| `.env` | Environment variables for PostHog API key and host |
| `instrumentation-client.ts` | Client-side PostHog initialization with error tracking |
| `components/tracked-back-link.tsx` | Tracked navigation component for About page |

## Events Instrumented

| Event Name | Description | File |
|------------|-------------|------|
| `todo_created` | User creates a new todo item | `components/todos/todo-list.tsx` |
| `todo_completed` | User marks a todo item as completed | `components/todos/todo-list.tsx` |
| `todo_uncompleted` | User marks a completed todo item as incomplete | `components/todos/todo-list.tsx` |
| `todo_deleted` | User deletes a todo item | `components/todos/todo-list.tsx` |
| `todo_form_submitted` | User submits the todo creation form | `components/todos/todo-form.tsx` |
| `about_page_link_clicked` | User clicks the About link from the main todo list page | `components/todos/todo-list.tsx` |
| `back_to_todos_clicked` | User clicks Back to Todos from About page | `components/tracked-back-link.tsx` |
| `todos_fetch_error` | Error occurred while fetching todos from API | `components/todos/todo-list.tsx` |
| `todo_create_error` | Error occurred while creating a new todo | `components/todos/todo-list.tsx` |
| `todo_update_error` | Error occurred while updating a todo | `components/todos/todo-list.tsx` |
| `todo_delete_error` | Error occurred while deleting a todo | `components/todos/todo-list.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard
- [Analytics basics](https://us.posthog.com/project/2/dashboard/1020751) - Main dashboard with all insights

### Insights
- [Todo Activity Over Time](https://us.posthog.com/project/2/insights/wPCITUhb) - Tracks todo creation, completion, and deletion events over time
- [Todo Creation Funnel](https://us.posthog.com/project/2/insights/pY9S1NkX) - Tracks the conversion from form submission to successful todo creation
- [Task Completion Rate](https://us.posthog.com/project/2/insights/vJQJbXNq) - Shows the ratio of completed todos vs created todos over time
- [Error Events](https://us.posthog.com/project/2/insights/Eb6D36Lv) - Tracks all error events in the application for monitoring reliability
- [Navigation Events](https://us.posthog.com/project/2/insights/szdj6OdF) - Tracks user navigation between pages in the app

## Getting Started

1. Run `pnpm dev` to start the development server
2. Interact with the todo app to generate events
3. Visit your [PostHog dashboard](https://us.posthog.com/project/2/dashboard/1020751) to see the data flow in
