export type Role = 'admin' | 'user'

export type Profile = {
  id: string
  email: string
  role: Role
  created_at: string
  updated_at: string
}
