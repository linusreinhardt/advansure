'use client'

import { useActionState } from 'react'
import { login, type LoginState } from './actions'

const initialState: LoginState = {}

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialState)

  return (
    <form action={formAction} className="form">
      <div className="field">
        <label htmlFor="email" className="label">
          E-Mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="input"
          placeholder="name@firma.de"
        />
      </div>

      <div className="field">
        <label htmlFor="password" className="label">
          Passwort
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
          placeholder="••••••••"
        />
      </div>

      {state.error && <p className="alert alert-error">{state.error}</p>}

      <button type="submit" className="btn btn-primary" disabled={isPending}>
        {isPending ? 'Anmelden …' : 'Anmelden'}
      </button>
    </form>
  )
}
