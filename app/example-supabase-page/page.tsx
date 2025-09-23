import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function ExampleSupabasePage() {
  // Create Supabase client
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError) {
    console.error('❌ Error getting user:', userError)
  }

  if (!user) {
    // Redirect to login if not authenticated
    redirect('/auth/login')
  }

  // Example: Fetch user profile from your profiles table (if you have one)
  let profile = null
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error fetching profile:', error)
    } else {
      profile = data
    }
  } catch (error) {
    console.error('❌ Profile fetch error:', error)
  }

  // Example: Fetch some todos (if you have a todos table)
  let todos = []
  try {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching todos:', error)
    } else {
      todos = data || []
    }
  } catch (error) {
    console.error('❌ Todos fetch error:', error)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Supabase Server Example</h1>
      
      {/* User Info Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">User Information</h2>
        <div className="grid gap-2">
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Email Confirmed:</strong> {user.email_confirmed_at ? '✅ Yes' : '❌ No'}</p>
          <p><strong>Created:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
          {user.last_sign_in_at && (
            <p><strong>Last Sign In:</strong> {new Date(user.last_sign_in_at).toLocaleDateString()}</p>
          )}
        </div>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Profile</h2>
        {profile ? (
          <div className="grid gap-2">
            <p><strong>Name:</strong> {profile.name || 'Not set'}</p>
            <p><strong>Plan:</strong> {profile.plan || 'explorer'}</p>
            <p><strong>Onboarding Complete:</strong> {profile.onboarding_complete ? '✅ Yes' : '❌ No'}</p>
          </div>
        ) : (
          <p className="text-gray-500">No profile found (this is normal if you're using Neon DB for profiles)</p>
        )}
      </div>

      {/* Todos Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Todos ({todos.length})</h2>
        {todos.length > 0 ? (
          <ul className="space-y-2">
            {todos.map((todo: any) => (
              <li key={todo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span>{todo.title || todo.text || JSON.stringify(todo)}</span>
                <span className="text-sm text-gray-500">
                  {todo.created_at ? new Date(todo.created_at).toLocaleDateString() : 'No date'}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No todos found</p>
            <p className="text-sm text-gray-400">
              This table might not exist in your database yet. 
              This is just an example of how to fetch data.
            </p>
          </div>
        )}
      </div>

      {/* Debug Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Debug Info</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>✅ Supabase server client working</li>
          <li>✅ User authentication successful</li>
          <li>✅ Database queries executing</li>
          <li>
            📍 Visit{' '}
            <a href="/api/debug/supabase" className="underline" target="_blank">
              /api/debug/supabase
            </a>{' '}
            for configuration details
          </li>
        </ul>
      </div>
    </div>
  )
}
