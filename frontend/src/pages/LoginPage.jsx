import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  LockKeyhole,
  UserRound,
  ShieldCheck,
  FolderKanban,
  BarChart3,
  Scale,
} from 'lucide-react'

import { login } from '../api/client'
import logoImg from '../assets/logowhite.png'
import '../styles/app.css'

export default function LoginPage() {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!username.trim() || !password.trim()) {
      setError('نام کاربری و رمز عبور را وارد کنید.')
      return
    }

    setError('')
    setLoading(true)

    try {
      await login(username.trim(), password)

      localStorage.setItem(
        'auth_username',
        username.trim(),
      )

      localStorage.setItem(
        'auth_remember',
        rememberMe ? 'true' : 'false',
      )

      navigate('/', { replace: true })
    } catch (err) {
      setError(
        err?.message ||
          'نام کاربری یا رمز عبور اشتباه است.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page" dir="rtl">
      <section className="auth-shell">

        {/* بخش برند */}
        <div className="auth-brand-panel">
          <div className="auth-brand-content">
            <div className="auth-brand-logo">
              <img
                src={logoImg}
                alt="جهاد دانشگاهی"
              />
            </div>

            <h1>
              سامانه حقوقی جهاد دانشگاهی
            </h1>

            <p>
              مدیریت هوشمند پرونده‌ها و فعالیت‌های حقوقی
            </p>
          </div>

          <div className="auth-decoration auth-decoration-one" />
          <div className="auth-decoration auth-decoration-two" />

          <div className="auth-features">
            <div className="auth-feature">
              <span>
                <Scale size={22} />
              </span>
              <small>
                حقوقی و تخصصی
              </small>
            </div>

            <div className="auth-feature">
              <span>
                <FolderKanban size={22} />
              </span>
              <small>
                مدیریت پرونده‌ها
              </small>
            </div>

            <div className="auth-feature">
              <span>
                <BarChart3 size={22} />
              </span>
              <small>
                گزارش‌های دقیق
              </small>
            </div>

            <div className="auth-feature">
              <span>
                <ShieldCheck size={22} />
              </span>
              <small>
                امن و مطمئن
              </small>
            </div>
          </div>
        </div>

        {/* فرم ورود */}
        <div className="auth-form-panel">
          <form
            className="auth-card"
            onSubmit={handleSubmit}
          >
            <div className="auth-lock">
              <LockKeyhole size={25} />
            </div>

            <div className="auth-heading">
              <h2>
                ورود به سامانه
              </h2>

              <p>
                برای ورود از حساب کاربری خود استفاده کنید
              </p>
            </div>

            <div className="auth-field">
              <label htmlFor="username">
                نام کاربری
              </label>

              <div className="auth-input-wrapper">
                <UserRound size={20} />

                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(event) =>
                    setUsername(event.target.value)
                  }
                  placeholder="نام کاربری خود را وارد کنید"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="password">
                رمز عبور
              </label>

              <div className="auth-input-wrapper">
                <LockKeyhole size={20} />

                <input
                  id="password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="رمز عبور خود را وارد کنید"
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current,
                    )
                  }
                  aria-label="نمایش یا مخفی کردن رمز عبور"
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            <label className="auth-remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) =>
                  setRememberMe(
                    event.target.checked,
                  )
                }
              />

              <span>
                مرا به خاطر بسپار
              </span>
            </label>

            {error && (
              <div
                className="auth-error"
                role="alert"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading
                ? 'در حال ورود...'
                : 'ورود'}
            </button>

            <div className="auth-footer-note">
              <ShieldCheck size={16} />

              <span>
                دسترسی فقط برای کاربران مجاز سامانه
              </span>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}