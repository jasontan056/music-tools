export const APP_TITLE = 'Skeleton Todos';
export const AUTH_TOKEN_KEY = 'skeleton3.session';
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export const isServer = () => typeof window === 'undefined';
export const formatDate = (value) => {
    const date = value instanceof Date ? value : new Date(value);
    return date.toLocaleString('en-US', { hour12: false });
};
export const formatRelativeDate = (value) => {
    if (!value) {
        return 'No due date';
    }
    const date = value instanceof Date ? value : new Date(value);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
};
export var TodoStatus;
(function (TodoStatus) {
    TodoStatus["BACKLOG"] = "BACKLOG";
    TodoStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TodoStatus["DONE"] = "DONE";
})(TodoStatus || (TodoStatus = {}));
export var TodoPriority;
(function (TodoPriority) {
    TodoPriority["LOW"] = "LOW";
    TodoPriority["MEDIUM"] = "MEDIUM";
    TodoPriority["HIGH"] = "HIGH";
})(TodoPriority || (TodoPriority = {}));
export const TODO_STATUS_LABELS = {
    [TodoStatus.BACKLOG]: 'Backlog',
    [TodoStatus.IN_PROGRESS]: 'In progress',
    [TodoStatus.DONE]: 'Done'
};
export const TODO_PRIORITY_LABELS = {
    [TodoPriority.LOW]: 'Low',
    [TodoPriority.MEDIUM]: 'Medium',
    [TodoPriority.HIGH]: 'High'
};
export const TODO_PRIORITY_COLORS = {
    [TodoPriority.LOW]: 'teal',
    [TodoPriority.MEDIUM]: 'orange',
    [TodoPriority.HIGH]: 'red'
};
