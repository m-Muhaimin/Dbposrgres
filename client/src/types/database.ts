export interface Profile {
  id: string
  username: string
  avatar_url: string
  created_at: string
}

export interface Todo {
  id: string
  user_id: string
  task: string
  is_complete: boolean
  created_at: string
}