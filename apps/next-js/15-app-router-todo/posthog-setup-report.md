# PostHog post-wizard report

The wizard has completed a deep integration of your Next.js 15 Todo application with PostHog analytics. The integration includes client-side event tracking using the modern `instrumentation-client.ts` approach (recommended for Next.js 15.3+), automatic exception capture, and comprehensive event tracking for all core user interactions.

## Files Created/Modified

| File | Change Type | Description |
|------|-------------|-------------|
| `.env` | Created | Environment variables for PostHog API key and host |
| `instrumentation-client.ts` | Created | Client-side PostHog initialization with exception capture |
| `components/todos/todo-list.tsx` | Modified | Added event tracking for CRUD operations and error handling |
| `app/about/page.tsx` | Modified | Converted to client component, added navigation tracking |

## Events Instrumented

| Event Name | Description | File |
|------------|-------------|------|
| `todo_created` | User successfully creates a new todo item | `components/todos/todo-list.tsx` |
| `todo_completed` | User marks a todo item as completed | `components/todos/todo-list.tsx` |
| `todo_uncompleted` | User marks a completed todo item as incomplete/active | `components/todos/todo-list.tsx` |
| `todo_deleted` | User deletes a todo item | `components/todos/todo-list.tsx` |
| `todo_create_failed` | Error occurred when attempting to create a todo | `components/todos/todo-list.tsx` |
| `todo_update_failed` | Error occurred when attempting to update a todo | `components/todos/todo-list.tsx` |
| `todo_delete_failed` | Error occurred when attempting to delete a todo | `components/todos/todo-list.tsx` |
| `todos_fetch_failed` | Error occurred when fetching the todo list | `components/todos/todo-list.tsx` |
| `about_page_link_clicked` | User clicks the About link from the main todo list page | `components/todos/todo-list.tsx` |
| `back_to_todos_clicked` | User clicks the Back to Todos link from the About page | `app/about/page.tsx` |

## Event Properties

Each event includes relevant contextual properties:

- **todo_created**: `todo_id`, `todo_title`, `has_description`
- **todo_completed/uncompleted**: `todo_id`, `todo_title`
- **todo_deleted**: `todo_id`, `todo_title`, `was_completed`
- **Error events**: `error_message`, plus relevant context (e.g., `todo_id`, `todo_title`)
- **Navigation events**: `source_page`, `active_todos_count`, `completed_todos_count`

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard
- [Analytics basics](https://us.posthog.com/project/2/dashboard/1020893) - Key metrics for todo app user engagement, conversions, and error tracking

### Insights
- [Todo Activity Trends](https://us.posthog.com/project/2/insights/XiXVqUbz) - Daily trends of todos created, completed, and deleted
- [Todo Completion Funnel](https://us.posthog.com/project/2/insights/ZzDgEJlh) - Conversion funnel from todo creation to completion within 7 days
- [Error Tracking](https://us.posthog.com/project/2/insights/ojQOGLlU) - Monitor all error events across the todo application
- [Daily Active Users Completing Todos](https://us.posthog.com/project/2/insights/tFqjbSAm) - Unique users completing todos each day
- [Navigation Tracking](https://us.posthog.com/project/2/insights/dX5zPG1J) - Track navigation between main pages and about page

## Additional Features Enabled

- **Automatic Exception Capture**: Unhandled JavaScript exceptions are automatically captured via `capture_exceptions: true`
- **Automatic Pageviews**: PostHog will automatically capture pageviews with the `defaults: '2025-05-24'` setting
- **Debug Mode**: Debug logging is enabled in development mode for easier troubleshooting
