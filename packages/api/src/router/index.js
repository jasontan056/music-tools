import { router } from '../trpc.js';
import { authRouter } from './auth.js';
import { todoRouter } from './todo.js';
export const appRouter = router({
    auth: authRouter,
    todo: todoRouter
});
