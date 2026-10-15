import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

import type {
  ParticipantRecord,
  ParticipantType,
} from '../../../shared/participant.types';

import type { ScreenProps } from '../../app/screen.types';
import { getErrorMessage } from '../../logic/get-error-message';
import { Modal } from '../components/Modal';

interface ParticipantFormState {
  fullName: string;
  participantType: ParticipantType;
  groupName: string;
  positionOrSubject: string;
}

const emptyForm: ParticipantFormState = {
  fullName: '',
  participantType: 'student',
  groupName: '',
  positionOrSubject: '',
};

function getParticipantTypeLabel(type: ParticipantType): string {
  return type === 'teacher'
    ? '\u041f\u0440\u0435\u043f\u043e\u0434\u0430\u0432\u0430\u0442\u0435\u043b\u044c'
    : '\u0421\u0442\u0443\u0434\u0435\u043d\u0442';
}

export function ParticipantsScreen({ api, notify }: ScreenProps) {
  const [participants, setParticipants] = useState<ParticipantRecord[]>([]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ParticipantType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] =
    useState<ParticipantRecord | null>(null);
  const [form, setForm] = useState<ParticipantFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  async function loadData(): Promise<void> {
    setIsLoading(true);

    try {
      setParticipants(await api.participants.list());
    } catch (loadError) {
      notify(
        'error',
        getErrorMessage(
          loadError,
          '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u0443\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u043e\u0432.',
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function openCreateModal(): void {
    setEditingParticipant(null);
    setForm(emptyForm);
    setFormError(null);
    setIsModalOpen(true);
  }

  function openEditModal(participant: ParticipantRecord): void {
    setEditingParticipant(participant);
    setForm({
      fullName: participant.fullName,
      participantType: participant.participantType,
      groupName: participant.groupName ?? '',
      positionOrSubject: participant.positionOrSubject ?? '',
    });
    setFormError(null);
    setIsModalOpen(true);
  }

  function closeModal(): void {
    setIsModalOpen(false);
    setEditingParticipant(null);
    setForm(emptyForm);
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!form.fullName.trim()) {
      setFormError(
        '\u041f\u043e\u043b\u0435 \u00ab\u0424\u0418\u041e\u00bb \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u043e.',
      );
      return;
    }

    if (form.participantType === 'student' && !form.groupName.trim()) {
      setFormError(
        '\u0414\u043b\u044f \u0441\u0442\u0443\u0434\u0435\u043d\u0442\u0430 \u0433\u0440\u0443\u043f\u043f\u0430 \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u0430.',
      );
      return;
    }

    if (form.participantType === 'teacher' && !form.positionOrSubject.trim()) {
      setFormError(
        '\u0414\u043b\u044f \u043f\u0440\u0435\u043f\u043e\u0434\u0430\u0432\u0430\u0442\u0435\u043b\u044f \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u0430 \u0434\u043e\u043b\u0436\u043d\u043e\u0441\u0442\u044c \u0438\u043b\u0438 \u043f\u0440\u0435\u0434\u043c\u0435\u0442.',
      );
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const payload = {
        fullName: form.fullName,
        participantType: form.participantType,
        groupName:
          form.participantType === 'student' ? form.groupName : undefined,
        positionOrSubject:
          form.participantType === 'teacher'
            ? form.positionOrSubject
            : undefined,
      };

      if (editingParticipant) {
        await api.participants.update(editingParticipant.id, payload);
        notify(
          'success',
          '\u0423\u0447\u0430\u0441\u0442\u043d\u0438\u043a \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d.',
        );
      } else {
        await api.participants.create(payload);
        notify(
          'success',
          '\u0423\u0447\u0430\u0441\u0442\u043d\u0438\u043a \u0441\u043e\u0437\u0434\u0430\u043d.',
        );
      }

      closeModal();
      await loadData();
    } catch (submitError) {
      setFormError(
        getErrorMessage(
          submitError,
          '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0441\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u0443\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u0430.',
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(participantId: number): Promise<void> {
    if (
      !window.confirm(
        '\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u044d\u0442\u043e\u0433\u043e \u0443\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u0430?',
      )
    ) {
      return;
    }

    try {
      await api.participants.delete(participantId);
      notify(
        'success',
        '\u0423\u0447\u0430\u0441\u0442\u043d\u0438\u043a \u0443\u0434\u0430\u043b\u0435\u043d.',
      );
      await loadData();
    } catch (deleteError) {
      notify(
        'error',
        getErrorMessage(
          deleteError,
          '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0443\u0434\u0430\u043b\u0438\u0442\u044c \u0443\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u0430.',
        ),
      );
    }
  }

  const filteredParticipants = participants.filter((participant) => {
    const matchesQuery = [
      participant.fullName,
      participant.groupName ?? '',
      participant.positionOrSubject ?? '',
    ]
      .join(' ')
      .toLowerCase()
      .includes(query.trim().toLowerCase());
    const matchesType =
      typeFilter === 'all' || participant.participantType === typeFilter;

    return matchesQuery && matchesType;
  });

  return (
    <section className="screen-card">
      <header className="screen-card__header">
        <div>
          <p className="screen-card__eyebrow">
            {'\u0421\u043f\u0440\u0430\u0432\u043e\u0447\u043d\u0438\u043a'}
          </p>
          <h2 className="screen-card__title">
            {'\u0423\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u0438'}
          </h2>
        </div>
        <button
          className="button button--primary"
          onClick={openCreateModal}
          type="button"
        >
          {'\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0443\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u0430'}
        </button>
      </header>

      <div className="toolbar toolbar--split">
        <input
          className="field__input"
          placeholder={
            '\u041f\u043e\u0438\u0441\u043a \u043f\u043e \u0438\u043c\u0435\u043d\u0438, \u0433\u0440\u0443\u043f\u043f\u0435 \u0438\u043b\u0438 \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u0443'
          }
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          className="field__input toolbar__select"
          value={typeFilter}
          onChange={(event) =>
            setTypeFilter(event.target.value as 'all' | ParticipantType)
          }
        >
          <option value="all">{'\u0412\u0441\u0435 \u0442\u0438\u043f\u044b'}</option>
          <option value="teacher">
            {'\u041f\u0440\u0435\u043f\u043e\u0434\u0430\u0432\u0430\u0442\u0435\u043b\u044c'}
          </option>
          <option value="student">{'\u0421\u0442\u0443\u0434\u0435\u043d\u0442'}</option>
        </select>
      </div>

      <div className="table-shell">
        <table className="data-table">
          <thead>
            <tr>
              <th>{'\u0424\u0418\u041e'}</th>
              <th>{'\u0422\u0438\u043f'}</th>
              <th>{'\u0413\u0440\u0443\u043f\u043f\u0430'}</th>
              <th>
                {'\u0414\u043e\u043b\u0436\u043d\u043e\u0441\u0442\u044c / \u041f\u0440\u0435\u0434\u043c\u0435\u0442'}
              </th>
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
            ) : filteredParticipants.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  {'\u0423\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u0438 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u044b.'}
                </td>
              </tr>
            ) : (
              filteredParticipants.map((participant) => (
                <tr key={participant.id}>
                  <td>{participant.fullName}</td>
                  <td>{getParticipantTypeLabel(participant.participantType)}</td>
                  <td>{participant.groupName ?? '-'}</td>
                  <td>{participant.positionOrSubject ?? '-'}</td>
                  <td className="actions-cell">
                    <button
                      className="button button--ghost"
                      onClick={() => openEditModal(participant)}
                      type="button"
                    >
                      {'\u0418\u0437\u043c\u0435\u043d\u0438\u0442\u044c'}
                    </button>
                    <button
                      className="button button--danger"
                      onClick={() => handleDelete(participant.id)}
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
          editingParticipant
            ? '\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435 \u0443\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u0430'
            : '\u0421\u043e\u0437\u0434\u0430\u043d\u0438\u0435 \u0443\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u0430'
        }
        onClose={closeModal}
      >
        <form className="modal-form" onSubmit={handleSubmit}>
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
            <span className="field__label">{'\u0422\u0438\u043f'}</span>
            <select
              className="field__input"
              value={form.participantType}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  participantType: event.target.value as ParticipantType,
                }))
              }
            >
              <option value="student">{'\u0421\u0442\u0443\u0434\u0435\u043d\u0442'}</option>
              <option value="teacher">
                {'\u041f\u0440\u0435\u043f\u043e\u0434\u0430\u0432\u0430\u0442\u0435\u043b\u044c'}
              </option>
            </select>
          </label>

          {form.participantType === 'student' ? (
            <label className="field">
              <span className="field__label">{'\u0413\u0440\u0443\u043f\u043f\u0430'}</span>
              <input
                className="field__input"
                value={form.groupName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    groupName: event.target.value,
                  }))
                }
              />
            </label>
          ) : (
            <label className="field">
              <span className="field__label">
                {'\u0414\u043e\u043b\u0436\u043d\u043e\u0441\u0442\u044c / \u041f\u0440\u0435\u0434\u043c\u0435\u0442'}
              </span>
              <input
                className="field__input"
                value={form.positionOrSubject}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    positionOrSubject: event.target.value,
                  }))
                }
              />
            </label>
          )}

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
                : editingParticipant
                  ? '\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c'
                  : '\u0421\u043e\u0437\u0434\u0430\u0442\u044c'}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
