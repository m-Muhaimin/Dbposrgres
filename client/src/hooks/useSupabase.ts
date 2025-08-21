import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Todo, Profile } from '../types/database'

export const useTodos = (userId: string) => {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTodos()

    // Real-time subscriptions
    const subscription = supabase
      .channel('todos-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'todos' },
        fetchTodos
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  const fetchTodos = async () => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTodos(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addTodo = async (task: string) => {
    const { error } = await supabase
      .from('todos')
      .insert([{ task, user_id: userId }])

    if (error) throw error
  }

  const toggleTodo = async (id: string, isComplete: boolean) => {
    const { error } = await supabase
      .from('todos')
      .update({ is_complete: isComplete })
      .eq('id', id)

    if (error) throw error
  }

  const deleteTodo = async (id: string) => {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  return { todos, loading, error, addTodo, toggleTodo, deleteTodo }
}

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return { user, loading, signUp, signIn, signOut }
}