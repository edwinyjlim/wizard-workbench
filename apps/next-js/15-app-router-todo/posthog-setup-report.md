# PostHog post-wizard report

The wizard has completed a deep integration of your Next.js 15 Todo App project with PostHog analytics. The integration includes client-side event tracking using the modern `instrumentation-client.ts` approach (recommended for Next.js 15.3+), automatic pageview capture, exception tracking, and a reverse proxy configuration to improve tracking reliability.

## Integration Summary

### Files Created
- **`instrumentation-client.ts`** - PostHog client-side initialization with exception capture enabled
- **`.env.local`** - Environment variables for PostHog API key and host

### Files Modified
- **`next.config.ts`** - Added reverse proxy rewrites to route PostHog requests through `/ingest` path
- **`components/todos/todo-list.tsx`** - Added event tracking for all todo operations

## Events Tracked

| Event Name | Description | File |
|------------|-------------|------|
| `todo_list_loaded` | User views the todo list (top of funnel) | `components/todos/todo-list.tsx` |
| `todo_created` | User creates a new todo item | `components/todos/todo-list.tsx` |
| `todo_completed` | User marks a todo item as completed | `components/todos/todo-list.tsx` |
| `todo_uncompleted` | User marks a completed todo item as incomplete | `components/todos/todo-list.tsx` |
| `todo_deleted` | User deletes a todo item | `components/todos/todo-list.tsx` |
| `todo_fetch_error` | Error occurred while fetching todos | `components/todos/todo-list.tsx` |
| `todo_create_error` | Error occurred while creating a todo | `components/todos/todo-list.tsx` |
| `todo_update_error` | Error occurred while updating a todo | `components/todos/todo-list.tsx` |
| `todo_delete_error` | Error occurred while deleting a todo | `components/todos/todo-list.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard
- [Analytics basics](https://us.posthog.com/project/2/dashboard/1020745) - Main dashboard with all insights

### Insights
- [Todo Creation Trend](https://us.posthog.com/project/2/insights/Zje45Rk2) - Track how many todos are being created over time
- [Todo Completion Funnel](https://us.posthog.com/project/2/insights/Tlcimyea) - Conversion funnel from viewing todo list to completing a todo
- [Todo Actions Breakdown](https://us.posthog.com/project/2/insights/RDfesjs8) - Compare todo actions: created, completed, uncompleted, deleted
- [Error Tracking](https://us.posthog.com/project/2/insights/OrzTOqUZ) - Monitor API errors across todo operations
- [Todo Completion Rate](https://us.posthog.com/project/2/insights/jyf9pZa1) - Ratio of completed todos vs deleted todos (retention indicator)

## Configuration Details

### Environment Variables
Make sure your `.env.local` file contains:
```
NEXT_PUBLIC_POSTHOG_KEY=sTMFPsFhdP1Ssg
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### Reverse Proxy
The integration includes a reverse proxy configuration in `next.config.ts` that routes PostHog requests through your domain, improving reliability by avoiding ad blockers.
