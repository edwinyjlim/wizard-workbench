# PostHog post-wizard report

The wizard has completed a deep integration of your Next.js 15 Todo App with PostHog analytics. The integration uses the recommended `instrumentation-client.ts` approach for Next.js 15.3+, which provides lightweight client-side initialization without the need for a React provider wrapper. Environment variables are properly configured for the PostHog API key and host, and all custom events track meaningful user actions with relevant properties.

## Files Created/Modified

| File | Change |
|------|--------|
| `.env` | Created with `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` environment variables |
| `instrumentation-client.ts` | Created for PostHog client-side initialization with exception tracking and debug mode |
| `components/todos/todo-list.tsx` | Added event tracking for todo CRUD operations and error handling |
| `components/todos/todo-form.tsx` | Added form submission event tracking |

## Events Instrumented

| Event Name | Description | File |
|------------|-------------|------|
| `todo_created` | User successfully creates a new todo item | `components/todos/todo-list.tsx` |
| `todo_completed` | User marks a todo item as completed | `components/todos/todo-list.tsx` |
| `todo_uncompleted` | User marks a previously completed todo as incomplete | `components/todos/todo-list.tsx` |
| `todo_deleted` | User deletes a todo item | `components/todos/todo-list.tsx` |
| `todo_form_submitted` | User submits the todo creation form | `components/todos/todo-form.tsx` |
| `todo_create_failed` | Error occurred when attempting to create a todo | `components/todos/todo-list.tsx` |
| `todo_update_failed` | Error occurred when attempting to update a todo | `components/todos/todo-list.tsx` |
| `todo_delete_failed` | Error occurred when attempting to delete a todo | `components/todos/todo-list.tsx` |
| `todos_fetch_failed` | Error occurred when loading the todos list | `components/todos/todo-list.tsx` |

## Automatic Features Enabled

- **Automatic pageview tracking**: PostHog will automatically capture `$pageview` events on navigation
- **Exception tracking**: Unhandled exceptions are automatically captured via `capture_exceptions: true`
- **Session recording**: Available through PostHog's default configuration

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard
- [Analytics basics](https://us.posthog.com/project/2/dashboard/1020822) - Main dashboard with all insights

### Insights
- [Todo Activity Over Time](https://us.posthog.com/project/2/insights/KO3oxl6l) - Track daily todo creation, completion, and deletion activity
- [Todo Creation Funnel](https://us.posthog.com/project/2/insights/x5k6d07y) - Track conversion from form submission to successful todo creation
- [Task Completion Rate](https://us.posthog.com/project/2/insights/ZnH4ZMUc) - Track the funnel from todo creation to completion
- [Error Monitoring](https://us.posthog.com/project/2/insights/YWJywWDl) - Track all error events to monitor application reliability
- [Todo Deletion vs Completion](https://us.posthog.com/project/2/insights/a808oYvP) - Compare how often users delete vs complete todos
