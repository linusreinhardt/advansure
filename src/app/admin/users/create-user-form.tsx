'use client'

import { useActionState, useEffect, useRef } from 'react'
import { createUser, type CreateUserState } from './actions'

const initialState: CreateUserState = {}

export function CreateUserForm() {
  const [state, formAction, isPending] = useActionState(createUser, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
    }
  }, [state.success])

  return (
    <form ref={formRef} action={formAction} className="form form-inline">
      <div className="field">
        <label htmlFor="new-email" className="label">
          E-Mail
        </label>
        <input
          id="new-email"
          name="email"
          type="email"
          required
          className="input"
          placeholder="name@firma.de"
        />
      </div>

      <div className="field">
        <label htmlFor="new-password" className="label">
          Passwort
        </label>
        <input
          id="new-password"
          name="password"
          type="text"
          required
          minLength={8}
          className="input"
          placeholder="min. 8 Zeichen"
        />
      </div>

      <div className="field field-narrow">
        <label htmlFor="new-role" className="label">
          Rolle
        </label>
        <select id="new-role" name="role" className="input" defaultValue="user">
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
      </div>

      <button type="submit" className="btn btn-primary" disabled={isPending}>
        {isPending ? 'Anlegen …' : 'Account anlegen'}
      </button>

      {state.error && (
        <p className="alert alert-error form-message">{state.error}</p>
      )}
      {state.success && (
        <p className="alert alert-success form-message">{state.success}</p>
      )}
    </form>
  )
}
