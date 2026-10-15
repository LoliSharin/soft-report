import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

import type {
  DictionaryRecord,
  DictionaryType,
} from '../../../../shared/dictionary.types';
import type { DesktopApi } from '../../../../shared/desktop.types';

import type { NoticeTone } from '../../../app/screen.types';
import { getErrorMessage } from '../../../logic/get-error-message';
import { Modal } from '../Modal';

function getDictionaryTypeLabel(type: DictionaryType): string {
  return type === 'event_level'
    ? '\u0423\u0440\u043e\u0432\u0435\u043d\u044c \u043c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u044f'
    : '\u0420\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442 \u0443\u0447\u0430\u0441\u0442\u0438\u044f';
}

interface DictionariesAdminPanelProps {
  api: DesktopApi;
  notify: (tone: NoticeTone, text: string) => void;
}

interface DictionaryFormState {
  type: DictionaryType;
  label: string;
  sortOrder: string;
  isActive: boolean;
}

const emptyForm: DictionaryFormState = {
  type: 'event_level',
  label: '',
  sortOrder: '0',
  isActive: true,
};

export function DictionariesAdminPanel({
  api,
  notify,
}: DictionariesAdminPanelProps) {
  const [items, setItems] = useState<DictionaryRecord[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | DictionaryType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DictionaryRecord | null>(null);
  const [form, setForm] = useState<DictionaryFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  async function loadItems(): Promise<void> {
    setIsLoading(true);

    try {
      setItems(await api.dictionaries.list());
    } catch (loadError) {
      notify(
        'error',
        getErrorMessage(
          loadError,
          '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u0441\u043f\u0440\u0430\u0432\u043e\u0447\u043d\u0438\u043a\u0438.',
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
  }, []);

  function openCreateModal(): void {
    setEditingItem(null);
    setForm(emptyForm);
    setFormError(null);
    setIsModalOpen(true);
  }

  function openEditModal(item: DictionaryRecord): void {
    setEditingItem(item);
    setForm({
      type: item.type,
      label: item.label,
      sortOrder: String(item.sortOrder),
      isActive: item.isActive,
    });
    setFormError(null);
    setIsModalOpen(true);
  }

  function closeModal(): void {
    setIsModalOpen(false);
    setEditingItem(null);
    setForm(emptyForm);
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!form.label.trim()) {
      setFormError(
        '\u041f\u043e\u043b\u0435 \u00ab\u041c\u0435\u0442\u043a\u0430\u00bb \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u043e.',
      );
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const payload = {
        type: form.type,
        label: form.label,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };

      if (editingItem) {
        await api.dictionaries.update(editingItem.id, payload);
        notify(
          'success',
          '\u0417\u0430\u043f\u0438\u0441\u044c \u0441\u043f\u0440\u0430\u0432\u043e\u0447\u043d\u0438\u043a\u0430 \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u0430.',
        );
      } else {
        await api.dictionaries.create(payload);
        notify(
          'success',
          '\u0417\u0430\u043f\u0438\u0441\u044c \u0441\u043f\u0440\u0430\u0432\u043e\u0447\u043d\u0438\u043a\u0430 \u0441\u043e\u0437\u0434\u0430\u043d\u0430.',
        );
      }

      closeModal();
      await loadItems();
    } catch (submitError) {
      setFormError(
        getErrorMessage(
          submitError,
          '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0441\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u0437\u0430\u043f\u0438\u0441\u044c \u0441\u043f\u0440\u0430\u0432\u043e\u0447\u043d\u0438\u043a\u0430.',
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(itemId: number): Promise<void> {
    if (
      !window.confirm(
        '\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u044d\u0442\u0443 \u0437\u0430\u043f\u0438\u0441\u044c \u0441\u043f\u0440\u0430\u0432\u043e\u0447\u043d\u0438\u043a\u0430?',
      )
    ) {
      return;
    }

    try {
      await api.dictionaries.delete(itemId);
      notify(
        'success',
        '\u0417\u0430\u043f\u0438\u0441\u044c \u0441\u043f\u0440\u0430\u0432\u043e\u0447\u043d\u0438\u043a\u0430 \u0443\u0434\u0430\u043b\u0435\u043d\u0430.',
      );
      await loadItems();
    } catch (deleteError) {
      notify(
        'error',
        getErrorMessage(
          deleteError,
          '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0443\u0434\u0430\u043b\u0438\u0442\u044c \u0437\u0430\u043f\u0438\u0441\u044c \u0441\u043f\u0440\u0430\u0432\u043e\u0447\u043d\u0438\u043a\u0430.',
        ),
      );
    }
  }

  const filteredItems = items.filter(
    (item) => typeFilter === 'all' || item.type === typeFilter,
  );

  return (
    <div className="admin-panel">
      <header className="admin-panel__header">
        <div>
          <h3>{'\u0421\u043f\u0440\u0430\u0432\u043e\u0447\u043d\u0438\u043a\u0438'}</h3>
          <p>
            {
              '\u0423\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u0435 \u0443\u0440\u043e\u0432\u043d\u044f\u043c\u0438 \u043c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u0439 \u0438 \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u0430\u043c\u0438 \u0443\u0447\u0430\u0441\u0442\u0438\u044f.'
            }
          </p>
        </div>
        <button
          className="button button--primary"
          onClick={openCreateModal}
          type="button"
        >
          {'\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0437\u0430\u043f\u0438\u0441\u044c'}
        </button>
      </header>

      <div className="toolbar toolbar--split">
        <div />
        <select
          className="field__input toolbar__select"
          value={typeFilter}
          onChange={(event) =>
            setTypeFilter(event.target.value as 'all' | DictionaryType)
          }
        >
          <option value="all">
            {'\u0412\u0441\u0435 \u0441\u043f\u0440\u0430\u0432\u043e\u0447\u043d\u0438\u043a\u0438'}
          </option>
          <option value="event_level">
            {'\u0423\u0440\u043e\u0432\u043d\u0438 \u043c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u0439'}
          </option>
          <option value="participation_result">
            {'\u0420\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u044b \u0443\u0447\u0430\u0441\u0442\u0438\u044f'}
          </option>
        </select>
      </div>

      <div className="table-shell">
        <table className="data-table">
          <thead>
            <tr>
              <th>{'\u0422\u0438\u043f'}</th>
              <th>{'\u041c\u0435\u0442\u043a\u0430'}</th>
              <th>{'\u041f\u043e\u0440\u044f\u0434\u043e\u043a'}</th>
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
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  {'\u0417\u0430\u043f\u0438\u0441\u0438 \u0441\u043f\u0440\u0430\u0432\u043e\u0447\u043d\u0438\u043a\u0430 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u044b.'}
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id}>
                  <td>{getDictionaryTypeLabel(item.type)}</td>
                  <td>{item.label}</td>
                  <td>{item.sortOrder}</td>
                  <td>
                    {item.isActive
                      ? '\u0410\u043a\u0442\u0438\u0432\u043d\u0430'
                      : '\u041d\u0435\u0430\u043a\u0442\u0438\u0432\u043d\u0430'}
                  </td>
                  <td className="actions-cell">
                    <button
                      className="button button--ghost"
                      onClick={() => openEditModal(item)}
                      type="button"
                    >
                      {'\u0418\u0437\u043c\u0435\u043d\u0438\u0442\u044c'}
                    </button>
                    <button
                      className="button button--danger"
                      onClick={() => handleDelete(item.id)}
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
          editingItem
            ? '\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435 \u0437\u0430\u043f\u0438\u0441\u0438 \u0441\u043f\u0440\u0430\u0432\u043e\u0447\u043d\u0438\u043a\u0430'
            : '\u0421\u043e\u0437\u0434\u0430\u043d\u0438\u0435 \u0437\u0430\u043f\u0438\u0441\u0438 \u0441\u043f\u0440\u0430\u0432\u043e\u0447\u043d\u0438\u043a\u0430'
        }
        onClose={closeModal}
      >
        <form className="modal-form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field__label">{'\u0422\u0438\u043f'}</span>
            <select
              className="field__input"
              disabled={Boolean(editingItem)}
              value={form.type}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  type: event.target.value as DictionaryType,
                }))
              }
            >
              <option value="event_level">
                {'\u0423\u0440\u043e\u0432\u0435\u043d\u044c \u043c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u044f'}
              </option>
              <option value="participation_result">
                {'\u0420\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442 \u0443\u0447\u0430\u0441\u0442\u0438\u044f'}
              </option>
            </select>
          </label>
          <label className="field">
            <span className="field__label">{'\u041c\u0435\u0442\u043a\u0430'}</span>
            <input
              className="field__input"
              value={form.label}
              onChange={(event) =>
                setForm((current) => ({ ...current, label: event.target.value }))
              }
            />
          </label>
          <label className="field">
            <span className="field__label">{'\u041f\u043e\u0440\u044f\u0434\u043e\u043a'}</span>
            <input
              className="field__input"
              type="number"
              value={form.sortOrder}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  sortOrder: event.target.value,
                }))
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
            <span>{'\u0410\u043a\u0442\u0438\u0432\u043d\u0430\u044f \u0437\u0430\u043f\u0438\u0441\u044c'}</span>
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
                : editingItem
                  ? '\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c'
                  : '\u0421\u043e\u0437\u0434\u0430\u0442\u044c'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
