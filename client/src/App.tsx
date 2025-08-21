import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";

import { useAuth, useTodos } from "./hooks/useSupabase";
import { useState } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { user, loading: authLoading, signIn, signOut } = useAuth();
  const {
    todos,
    loading: todosLoading,
    addTodo,
    toggleTodo,
    deleteTodo,
  } = useTodos(user?.id);
  const [newTask, setNewTask] = useState("");

  if (authLoading) return <div>Loading...</div>;

  if (!user) {
    return (
      <div>
        <h1>Please Sign In</h1>
        <button onClick={() => signIn("test@example.com", "password")}>
          Sign In
        </button>
      </div>
    );
  }

  const handleAddTodo = async () => {
    if (newTask.trim()) {
      await addTodo(newTask);
      setNewTask("");
    }
  };
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <div>
          <header>
            <h1>Welcome {user.email}</h1>
            <button onClick={signOut}>Sign Out</button>
          </header>

          <div>
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add a new task..."
              onKeyPress={(e) => e.key === "Enter" && handleAddTodo()}
            />
            <button onClick={handleAddTodo}>Add</button>
          </div>

          {todosLoading ? (
            <div>Loading todos...</div>
          ) : (
            <ul>
              {todos.map((todo) => (
                <li key={todo.id}>
                  <input
                    type="checkbox"
                    checked={todo.is_complete}
                    onChange={(e) => toggleTodo(todo.id, e.target.checked)}
                  />
                  <span
                    style={{
                      textDecoration: todo.is_complete
                        ? "line-through"
                        : "none",
                    }}
                  >
                    {todo.task}
                  </span>
                  <button onClick={() => deleteTodo(todo.id)}>Delete</button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
