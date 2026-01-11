# PostHog post-wizard report

The wizard has completed a deep integration of your Next.js 15 Todo App project. PostHog has been configured using the recommended `instrumentation-client.ts` approach for Next.js 15.3+, which provides lightweight client-side initialization without the need for a provider wrapper. The integration includes automatic pageview tracking, session replay, error tracking via `capture_exceptions`, and custom event tracking for all key user actions in the todo application.

## Files Created

| File | Description |
|------|-------------|
| `.env` | Environment variables for PostHog API key and host |
| `instrumentation-client.ts` | PostHog client-side initialization (Next.js 15.3+ recommended approach) |

## Files Modified

| File | Changes |
|------|---------|
| `components/todos/todo-list.tsx` | Added PostHog event captures and error tracking |
| `components/todos/todo-form.tsx` | Added form submission event capture |

## Events Instrumented

| Event Name | Description | File |
|------------|-------------|------|
| `todos_loaded` | User views the todo list (initial load) | `components/todos/todo-list.tsx` |
| `todo_created` | User creates a new todo item | `components/todos/todo-list.tsx` |
| `todo_completed` | User marks a todo as completed | `components/todos/todo-list.tsx` |
| `todo_uncompleted` | User marks a completed todo as incomplete | `components/todos/todo-list.tsx` |
| `todo_deleted` | User deletes a todo item | `components/todos/todo-list.tsx` |
| `todo_form_submitted` | User submits the todo creation form | `components/todos/todo-form.tsx` |
| `api_error` | An API error occurred during a todo operation | `components/todos/todo-list.tsx` |

## Event Properties

Each event includes relevant properties for analysis:

- **todos_loaded**: `total_todos`, `active_todos`, `completed_todos`
- **todo_created**: `todo_id`, `has_description`, `title_length`
- **todo_completed/uncompleted**: `todo_id`
- **todo_deleted**: `todo_id`, `was_completed`
- **todo_form_submitted**: `has_title`, `has_description`, `title_length`, `description_length`
- **api_error**: `error_type`, `error_message`

## Error Tracking

PostHog error tracking is enabled via:
- `capture_exceptions: true` in the initialization config (captures unhandled exceptions)
- `posthog.captureException(error)` calls in catch blocks for API errors

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard
- [Analytics basics](https://us.posthog.com/project/2/dashboard/1020771) - Main dashboard with all insights

### Insights
- [Todo Activity Overview](https://us.posthog.com/project/2/insights/2Eku11Vp) - Daily trend of todos created, completed, and deleted
- [Todo Creation Funnel](https://us.posthog.com/project/2/insights/ObU4pWQN) - Conversion from form submission to successful todo creation
- [Task Completion Funnel](https://us.posthog.com/project/2/insights/B7av3SD8) - Conversion rate from todo creation to completion
- [API Errors](https://us.posthog.com/project/2/insights/sMnKcmOP) - Track API errors to monitor application health
- [Daily Active Users](https://us.posthog.com/project/2/insights/kPINpyDY) - Unique users who loaded the app each day

## Getting Started

1. Run the development server: `pnpm dev`
2. Open [http://localhost:3000](http://localhost:3000) in your browser
3. Interact with the app to generate events
4. View your analytics at [PostHog](https://us.posthog.com)
