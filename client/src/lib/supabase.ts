// Database operations are handled by the backend API
// This file maintains compatibility with existing imports
export const supabase = {
  // Placeholder for compatibility - actual data operations go through the API
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null })
  }
}