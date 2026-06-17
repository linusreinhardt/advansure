import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <div className="auth-shell">
      <div className="auth-card card">
        <div className="brand brand-lg">
          <span className="brand-mark">L</span>
          <span className="brand-name">LinoHub</span>
        </div>
        <h1 className="auth-title">Anmelden</h1>
        <p className="muted">Bitte mit deinen Zugangsdaten einloggen.</p>
        <LoginForm />
      </div>
    </div>
  )
}
