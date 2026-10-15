import { useState } from 'react';

import type { AuthSession } from '../../shared/auth.types';
import type { DesktopApi } from '../../shared/desktop.types';

import { getErrorMessage } from '../logic/get-error-message';

interface LoginScreenProps {
  api: DesktopApi;
  onLoginSuccess: (session: AuthSession) => void;
}

export function LoginScreen({ api, onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const session = await api.auth.login({ username, password });
      onLoginSuccess(session);
    } catch (submitError) {
      setError(
        getErrorMessage(
          submitError,
          '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0432\u044b\u043f\u043e\u043b\u043d\u0438\u0442\u044c \u0432\u0445\u043e\u0434.',
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <h1 className="auth-card__title">
          {'\u0423\u0447\u0435\u0442 \u0434\u043e\u0441\u0442\u0438\u0436\u0435\u043d\u0438\u0439 \u0438 \u043c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u0439'}
        </h1>
        <p className="auth-card__description">
          {
            '\u0412\u043e\u0439\u0434\u0438\u0442\u0435 \u043f\u043e\u0434 \u0443\u0447\u0435\u0442\u043d\u043e\u0439 \u0437\u0430\u043f\u0438\u0441\u044c\u044e \u0430\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440\u0430 \u0438\u043b\u0438 \u043c\u0435\u0442\u043e\u0434\u0438\u0441\u0442\u0430, \u0447\u0442\u043e\u0431\u044b \u0443\u043f\u0440\u0430\u0432\u043b\u044f\u0442\u044c \u043c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u044f\u043c\u0438, \u0443\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u0430\u043c\u0438, \u0443\u0447\u0430\u0441\u0442\u0438\u0435\u043c, \u043e\u0442\u0447\u0435\u0442\u0430\u043c\u0438 \u0438 \u0441\u043f\u0440\u0430\u0432\u043e\u0447\u043d\u0438\u043a\u0430\u043c\u0438.'
          }
        </p>
        <p className="auth-card__meta">
          {'\u0421\u043e\u0437\u0434\u0430\u0442\u0435\u043b\u044c: \u0428\u0430\u0440\u0438\u043d \u041f\u0435\u0442\u0440, \u0418\u0421\u0418\u041f-24'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field__label">{'\u041b\u043e\u0433\u0438\u043d'}</span>
            <input
              className="field__input"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>

          <label className="field">
            <span className="field__label">{'\u041f\u0430\u0440\u043e\u043b\u044c'}</span>
            <input
              className="field__input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="button button--primary auth-form__submit" type="submit">
            {isSubmitting
              ? '\u0412\u0445\u043e\u0434...'
              : '\u0412\u043e\u0439\u0442\u0438'}
          </button>
        </form>

        <div className="auth-card__tips">
          <div>
            <strong>{'\u0410\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440'}</strong>
            <span>`admin / admin123`</span>
          </div>
          <div>
            <strong>{'\u041c\u0435\u0442\u043e\u0434\u0438\u0441\u0442'}</strong>
            <span>`methodist / user123`</span>
          </div>
        </div>
      </section>
    </main>
  );
}
