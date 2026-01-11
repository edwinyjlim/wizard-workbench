# PostHog post-wizard report

The wizard has completed a deep integration of your Next.js 15 Todo App with PostHog analytics. The integration uses the recommended `instrumentation-client.ts` approach for Next.js 15.3+, which provides automatic initialization of PostHog on the client side without requiring a provider component.

## Changes Made

### New Files Created
- `.env` - Environment variables for PostHog API key and host
- `instrumentation-client.ts` - Client-side PostHog initialization with automatic pageview capture, session replay, and error tracking enabled

### Files Modified
- `components/todos/todo-list.tsx` - Added event tracking for todo CRUD operations and error handling
- `components/todos/todo-form.tsx` - Added event tracking for form submissions

### Dependencies Installed
- `posthog-js` - PostHog JavaScript SDK

## Events Tracked

| Event Name | Description | File |
|------------|-------------|------|
| `todos_loaded` | Initial todo list loaded successfully - tracks app initialization and session starts | `components/todos/todo-list.tsx` |
| `todo_form_submitted` | User submits the todo form - tracks conversion from form interaction to actual submission | `components/todos/todo-form.tsx` |
| `todo_created` | User creates a new todo item - key conversion event indicating active engagement | `components/todos/todo-list.tsx` |
| `todo_completed` | User marks a todo item as completed - indicates task completion success | `components/todos/todo-list.tsx` |
| `todo_uncompleted` | User marks a completed todo as incomplete - indicates reconsideration or mistake correction | `components/todos/todo-list.tsx` |
| `todo_deleted` | User deletes a todo item - can indicate churn risk if done frequently without completion | `components/todos/todo-list.tsx` |
| `todos_load_failed` | Failed to load todos - critical error tracking for app functionality | `components/todos/todo-list.tsx` |
| `todo_create_failed` | Failed to create a todo - error tracking for conversion funnel drops | `components/todos/todo-list.tsx` |
| `todo_update_failed` | Failed to update a todo - error tracking for user friction points | `components/todos/todo-list.tsx` |
| `todo_delete_failed` | Failed to delete a todo - error tracking for user experience issues | `components/todos/todo-list.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard
- [Analytics basics](https://us.posthog.com/project/2/dashboard/1020784) - Main dashboard with all key metrics

### Insights
- [Todo Activity Over Time](https://us.posthog.com/project/2/insights/fVZUqas5) - Tracks daily todo creation, completion, and deletion activity
- [Todo Creation Funnel](https://us.posthog.com/project/2/insights/d9E7Puq6) - Conversion funnel from form submission to successful todo creation
- [Task Completion Funnel](https://us.posthog.com/project/2/insights/NGpOdksc) - Funnel showing how many created todos get completed
- [Error Events](https://us.posthog.com/project/2/insights/ixm0ftY7) - Tracks all error events to monitor app reliability
- [Daily Active Users](https://us.posthog.com/project/2/insights/YxqCw8Xj) - Unique users loading todos each day - key engagement metric

## Configuration

Your PostHog integration is configured with:
- **API Key**: Set via `NEXT_PUBLIC_POSTHOG_KEY` environment variable
- **Host**: Set via `NEXT_PUBLIC_POSTHOG_HOST` environment variable (https://us.i.posthog.com)
- **Automatic pageview capture**: Enabled via `defaults: '2025-05-24'`
- **Exception capture**: Enabled for automatic error tracking
- **Debug mode**: Enabled in development environment

To get started, run `pnpm dev` and interact with your todo app to start seeing events in PostHog!
