# PostHog post-wizard report

The wizard has completed a deep integration of your Next.js 15 Todo App project. PostHog has been configured using the recommended `instrumentation-client.ts` approach for Next.js 15.3+, which provides lightweight client-side initialization without the need for a provider wrapper. The integration includes automatic pageview tracking, exception capturing, and custom event tracking for all key user actions in your todo application.

## Integration Summary

### Files Created
- `.env` - Environment variables for PostHog API key and host
- `instrumentation-client.ts` - Client-side PostHog initialization with error tracking enabled

### Files Modified
- `components/todos/todo-list.tsx` - Added event tracking for todo operations and API errors
- `components/todos/todo-form.tsx` - Added form submission tracking

## Events Tracked

| Event Name | Description | File |
|------------|-------------|------|
| `todo_created` | User successfully created a new todo item - key conversion event | `components/todos/todo-list.tsx` |
| `todo_completed` | User marked a todo item as completed - engagement/conversion event | `components/todos/todo-list.tsx` |
| `todo_uncompleted` | User unmarked a completed todo - re-engagement event | `components/todos/todo-list.tsx` |
| `todo_deleted` | User deleted a todo item - potential churn indicator | `components/todos/todo-list.tsx` |
| `todo_form_submitted` | User submitted the todo creation form - tracks form engagement | `components/todos/todo-form.tsx` |
| `api_error` | API error occurred during fetch, create, update, or delete operations | `components/todos/todo-list.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard
- [Analytics basics](https://us.posthog.com/project/2/dashboard/1020761) - Core analytics dashboard for Todo App

### Insights
- [Todo Activity Trends](https://us.posthog.com/project/2/insights/gPt8l4cN) - Daily trends of todos created, completed, and deleted
- [Todo Completion Funnel](https://us.posthog.com/project/2/insights/HDPbyeRg) - Conversion funnel from form submission to todo completion
- [API Error Rate](https://us.posthog.com/project/2/insights/Htvyi3pS) - Track API errors over time by error type
- [Todo Deletion Rate (Churn Indicator)](https://us.posthog.com/project/2/insights/4SC591UQ) - Tracks deleted todos broken down by completion status
- [Daily Active Users](https://us.posthog.com/project/2/insights/UTPKO5jp) - Unique users creating and completing todos per day

## Configuration

Your PostHog environment variables are set in `.env`:
```
NEXT_PUBLIC_POSTHOG_KEY=sTMFPsFhdP1Ssg
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Make sure to add these to your deployment environment (Vercel, Netlify, etc.) as well.
