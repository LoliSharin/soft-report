import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

import type { UserRecord } from '../../../../shared/auth.types';
import type { DesktopApi } from '../../../../shared/desktop.types';

import type { NoticeTone } from '../../../app/screen.types';
import { getErrorMessage } from '../../../logic/get-error-message';
import { Modal } from '../Modal';

function getRoleLabel(role: 'admin' | 'user'): string {
  return role === 'admin'
    ? '\u0410\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440'
    : '\u041c\u0435\u0442\u043e\u0434\u0438\u0441\u0442';
}

interface UsersAdminPanelProps {
  api: DesktopApi;
  notify: (tone: NoticeTone, text: string) => void;
}

interface UserFormState {
  username: string;
  fullName: string;
  role: 'admin' | 'user';
  password: string;
  isActive: boolean;
}

const emptyForm: UserFormState = {
  username: '',
  fullName: '',
  role: 'user',
  password: '',
  isActive: true,
};

export function UsersAdminPanel({ api, notify }: UsersAdminPanelProps) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  async function loadUsers(): Promise<void> {
    setIsLoading(true);

    try {
      setUsers(await api.users.list());
    } catch (loadError) {
      notify(
        'error',
        getErrorMessage(
          loadError,
          '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0435\u0439.',
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  function openCreateModal(): void {
    setEditingUser(null);
    setForm(emptyForm);
    setFormError(null);
    setIsModalOpen(true);
  }

  function openEditModal(user: UserRecord): void {
    setEditingUser(user);
    setForm({
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      password: '',
      isActive: user.isActive,
    });
    setFormError(null);
    setIsModalOpen(true);
  }

  function closeModal(): void {
    setIsModalOpen(false);
    setEditingUser(null);
    setForm(emptyForm);
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!form.username.trim() || !form.fullName.trim()) {
      setFormError(
        '\u041b\u043e\u0433\u0438\u043d \u0438 \u0424\u0418\u041e \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u044b.',
      );
      return;
    }

    if (!editingUser && !form.password.trim()) {
      setFormError(
        '\u041f\u0430\u0440\u043e\u043b\u044c \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u0435\u043d \u0434\u043b\u044f \u043d\u043e\u0432\u043e\u0433\u043e \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f.',
      );
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const payload = {
        username: form.username,
        fullName: form.fullName,
        role: form.role,
        isActive: form.isActive,
        password: form.password || undefined,
      };

      if (editingUser) {
        await api.users.update(editingUser.id, payload);
        notify(
          'success',
          '\u041f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044c \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d.',
        );
      } else {
        await api.users.create(payload);
        notify(
          'success',
          '\u041f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044c \u0441\u043e\u0437\u0434\u0430\u043d.',
        );
      }

      closeModal();
      await loadUsers();
    } catch (submitError) {
      setFormError(
        getErrorMessage(
          submitError,
          '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0441\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f.',
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(userId: number): Promise<void> {
    if (
      !window.confirm(
        '\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u044d\u0442\u043e\u0433\u043e \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f?',
      )
    ) {
      return;
    }

    try {
      await api.users.delete(userId);
      notify(
        'success',
        '\u041f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044c \u0443\u0434\u0430\u043b\u0435\u043d.',
      );
      await loadUsers();
    } catch (deleteError) {
      notify(
        'error',
        getErrorMessage(
          deleteError,
          '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0443\u0434\u0430\u043b\u0438\u0442\u044c \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f.',
        ),
      );
    }
  }

  return (
    <div className="admin-panel">
      <header className="admin-panel__header">
        <div>
          <h3>{'\u041f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0438'}</h3>
          <p>
            {
              '\u0410\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440\u044b \u0438 \u043c\u0435\u0442\u043e\u0434\u0438\u0441\u0442\u044b \u0441 \u0440\u043e\u043b\u0435\u0432\u044b\u043c \u0434\u043e\u0441\u0442\u0443\u043f\u043e\u043c.'
            }
          </p>
        </div>
        <button
          className="button button--primary"
          onClick={openCreateModal}
          type="button"
        >
          {'\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f'}
        </button>
      </header>

      <div className="table-shell">
        <table className="data-table">
          <thead>
            <tr>
              <th>{'\u041b\u043e\u0433\u0438\u043d'}</th>
              <th>{'\u0424\u0418\u041e'}</th>
              <th>{'\u0420\u043e\u043b\u044c'}</th>
              <th>{'\u0421\u0442\u0430\u0442\u0443\u0441'}</th>
              <th className="actions-cell">
                {'\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044f'}
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5}>{'\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430...'}</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  {'\u041f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0438 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u044b.'}
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.fullName}</td>
                  <td>{getRoleLabel(user.role)}</td>
                  <td>
                    {user.isActive
                      ? '\u0410\u043a\u0442\u0438\u0432\u0435\u043d'
                      : '\u041d\u0435\u0430\u043a\u0442\u0438\u0432\u0435\u043d'}
                  </td>
                  <td className="actions-cell">
                    <button
                      className="button button--ghost"
                      onClick={() => openEditModal(user)}
                      type="button"
                    >
                      {'\u0418\u0437\u043c\u0435\u043d\u0438\u0442\u044c'}
                    </button>
                    <button
                      className="button button--danger"
                      onClick={() => handleDelete(user.id)}
                      type="button"
                    >
                      {'\u0423\u0434\u0430\u043b\u0438\u0442\u044c'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={isModalOpen}
        title={
          editingUser
            ? '\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435 \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f'
            : '\u0421\u043e\u0437\u0434\u0430\u043d\u0438\u0435 \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f'
        }
        onClose={closeModal}
      >
        <form className="modal-form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field__label">{'\u041b\u043e\u0433\u0438\u043d'}</span>
            <input
              className="field__input"
              value={form.username}
              onChange={(event) =>
                setForm((current) => ({ ...current, username: event.target.value }))
              }
            />
          </label>
          <label className="field">
            <span className="field__label">{'\u0424\u0418\u041e'}</span>
            <input
              className="field__input"
              value={form.fullName}
              onChange={(event) =>
                setForm((current) => ({ ...current, fullName: event.target.value }))
              }
            />
          </label>
          <label className="field">
            <span className="field__label">{'\u0420\u043e\u043b\u044c'}</span>
            <select
              className="field__input"
              value={form.role}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  role: event.target.value as 'admin' | 'user',
                }))
              }
            >
              <option value="user">
                {'\u041f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044c / \u041c\u0435\u0442\u043e\u0434\u0438\u0441\u0442'}
              </option>
              <option value="admin">
                {'\u0410\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440'}
              </option>
            </select>
          </label>
          <label className="field">
            <span className="field__label">
              {editingUser
                ? '\u041f\u0430\u0440\u043e\u043b\u044c (\u043e\u0441\u0442\u0430\u0432\u044c\u0442\u0435 \u043f\u0443\u0441\u0442\u044b\u043c, \u0447\u0442\u043e\u0431\u044b \u043d\u0435 \u043c\u0435\u043d\u044f\u0442\u044c)'
                : '\u041f\u0430\u0440\u043e\u043b\u044c'}
            </span>
            <input
              className="field__input"
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({ ...current, password: event.target.value }))
              }
            />
          </label>
          <label className="checkbox">
            <input
              checked={form.isActive}
              onChange={(event) =>
                setForm((current) => ({ ...current, isActive: event.target.checked }))
              }
              type="checkbox"
            />
            <span>
              {'\u0410\u043a\u0442\u0438\u0432\u043d\u044b\u0439 \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044c'}
            </span>
          </label>

          {formError ? <p className="form-error">{formError}</p> : null}

          <div className="modal-form__actions">
            <button
              className="button button--ghost"
              onClick={closeModal}
              type="button"
            >
              {'\u041e\u0442\u043c\u0435\u043d\u0430'}
            </button>
            <button className="button button--primary" type="submit">
              {isSaving
                ? '\u0421\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0438\u0435...'
                : editingUser
                  ? '\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c'
                  : '\u0421\u043e\u0437\u0434\u0430\u0442\u044c'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
