import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

import type { DictionaryRecord } from '../../../shared/dictionary.types';
import type { EventRecord } from '../../../shared/event.types';

import type { ScreenProps } from '../../app/screen.types';
import { getErrorMessage } from '../../logic/get-error-message';
import { Modal } from '../components/Modal';

interface EventFormState {
  levelId: string;
  eventDate: string;
  location: string;
  title: string;
}

const emptyForm: EventFormState = {
  levelId: '',
  eventDate: '',
  location: '',
  title: '',
};

const ALL_YEARS_VALUE = 'all';

const EVENTS_TEXT = {
  loadError:
    '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u043c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u044f.',
  required:
    '\u0417\u0430\u043f\u043e\u043b\u043d\u0438\u0442\u0435 \u0432\u0441\u0435 \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u044b\u0435 \u043f\u043e\u043b\u044f.',
  updated:
    '\u041c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u0435 \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u043e.',
  created:
    '\u041c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u0435 \u0441\u043e\u0437\u0434\u0430\u043d\u043e.',
  saveError:
    '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0441\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u043c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u0435.',
  deleteConfirm:
    '\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u044d\u0442\u043e \u043c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u0435?',
  deleted:
    '\u041c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u0435 \u0443\u0434\u0430\u043b\u0435\u043d\u043e.',
  deleteError:
    '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0443\u0434\u0430\u043b\u0438\u0442\u044c \u043c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u0435.',
};

function extractYear(date: string): number | null {
  const year = Number(date.slice(0, 4));

  return Number.isInteger(year) ? year : null;
}

export function EventsScreen({ api, notify }: ScreenProps) {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [levels, setLevels] = useState<DictionaryRecord[]>([]);
  const [query, setQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>(ALL_YEARS_VALUE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventRecord | null>(null);
  const [form, setForm] = useState<EventFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  async function loadData(): Promise<void> {
    setIsLoading(true);

    try {
      const [eventRows, levelRows] = await Promise.all([
        api.events.list(),
        api.dictionaries.list('event_level'),
      ]);

      setEvents(eventRows);
      setLevels(levelRows.filter((item) => item.isActive));
    } catch (loadError) {
      notify('error', getErrorMessage(loadError, EVENTS_TEXT.loadError));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function openCreateModal(): void {
    setEditingEvent(null);
    setForm(emptyForm);
    setFormError(null);
    setIsModalOpen(true);
  }

  function openEditModal(eventRecord: EventRecord): void {
    setEditingEvent(eventRecord);
    setForm({
      levelId: String(eventRecord.levelId),
      eventDate: eventRecord.eventDate,
      location: eventRecord.location,
      title: eventRecord.title,
    });
    setFormError(null);
    setIsModalOpen(true);
  }

  function closeModal(): void {
    setIsModalOpen(false);
    setEditingEvent(null);
    setForm(emptyForm);
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (
      !form.levelId ||
      !form.eventDate ||
      !form.location.trim() ||
      !form.title.trim()
    ) {
      setFormError(EVENTS_TEXT.required);
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const payload = {
        levelId: Number(form.levelId),
        eventDate: form.eventDate,
        location: form.location,
        title: form.title,
      };

      if (editingEvent) {
        await api.events.update(editingEvent.id, payload);
        notify('success', EVENTS_TEXT.updated);
      } else {
        await api.events.create(payload);
        notify('success', EVENTS_TEXT.created);
      }

      closeModal();
      await loadData();
    } catch (submitError) {
      setFormError(getErrorMessage(submitError, EVENTS_TEXT.saveError));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(eventId: number): Promise<void> {
    if (!window.confirm(EVENTS_TEXT.deleteConfirm)) {
      return;
    }

    try {
      await api.events.delete(eventId);
      notify('success', EVENTS_TEXT.deleted);
      await loadData();
    } catch (deleteError) {
      notify('error', getErrorMessage(deleteError, EVENTS_TEXT.deleteError));
    }
  }

  const availableYears = Array.from(
    new Set(
      events
        .map((eventRecord) => extractYear(eventRecord.eventDate))
        .filter((year): year is number => year !== null),
    ),
  ).sort((left, right) => right - left);

  useEffect(() => {
    if (
      selectedYear !== ALL_YEARS_VALUE &&
      !availableYears.includes(Number(selectedYear))
    ) {
      setSelectedYear(ALL_YEARS_VALUE);
    }
  }, [availableYears, selectedYear]);

  const filteredEvents = events.filter((eventRecord) => {
    const matchesYear =
      selectedYear === ALL_YEARS_VALUE ||
      eventRecord.eventDate.startsWith(`${selectedYear}-`);

    const haystack = [
      eventRecord.title,
      eventRecord.location,
      eventRecord.levelLabel,
      eventRecord.eventDate,
    ]
      .join(' ')
      .toLowerCase();

    return matchesYear && haystack.includes(query.trim().toLowerCase());
  });

  return (
    <section className="screen-card">
      <header className="screen-card__header">
        <div>
          <p className="screen-card__eyebrow">
            {'\u0421\u043f\u0440\u0430\u0432\u043e\u0447\u043d\u0438\u043a'}
          </p>
          <h2 className="screen-card__title">
            {'\u041c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u044f'}
          </h2>
        </div>
        <button
          className="button button--primary"
          onClick={openCreateModal}
          type="button"
        >
          {'\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u043c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u0435'}
        </button>
      </header>

      <div className="toolbar">
        <input
          className="field__input"
          placeholder={
            '\u041f\u043e\u0438\u0441\u043a \u043f\u043e \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u044e, \u043c\u0435\u0441\u0442\u0443, \u0443\u0440\u043e\u0432\u043d\u044e \u0438\u043b\u0438 \u0434\u0430\u0442\u0435'
          }
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          className="field__input toolbar__select"
          value={selectedYear}
          onChange={(event) => setSelectedYear(event.target.value)}
        >
          <option value={ALL_YEARS_VALUE}>Все годы</option>
          {availableYears.map((year) => (
            <option key={year} value={String(year)}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div className="table-shell">
        <table className="data-table">
          <thead>
            <tr>
              <th>{'\u0423\u0440\u043e\u0432\u0435\u043d\u044c'}</th>
              <th>{'\u0414\u0430\u0442\u0430'}</th>
              <th>{'\u041c\u0435\u0441\u0442\u043e'}</th>
              <th>{'\u041d\u0430\u0438\u043c\u0435\u043d\u043e\u0432\u0430\u043d\u0438\u0435'}</th>
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
            ) : filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  {'\u041c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u044f \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u044b.'}
                </td>
              </tr>
            ) : (
              filteredEvents.map((eventRecord) => (
                <tr key={eventRecord.id}>
                  <td>{eventRecord.levelLabel}</td>
                  <td>{eventRecord.eventDate}</td>
                  <td>{eventRecord.location}</td>
                  <td>{eventRecord.title}</td>
                  <td className="actions-cell">
                    <button
                      className="button button--ghost"
                      onClick={() => openEditModal(eventRecord)}
                      type="button"
                    >
                      {'\u0418\u0437\u043c\u0435\u043d\u0438\u0442\u044c'}
                    </button>
                    <button
                      className="button button--danger"
                      onClick={() => handleDelete(eventRecord.id)}
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
          editingEvent
            ? '\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435 \u043c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u044f'
            : '\u0421\u043e\u0437\u0434\u0430\u043d\u0438\u0435 \u043c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u044f'
        }
        onClose={closeModal}
      >
        <form className="modal-form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field__label">{'\u0423\u0440\u043e\u0432\u0435\u043d\u044c'}</span>
            <select
              className="field__input"
              value={form.levelId}
              onChange={(event) =>
                setForm((current) => ({ ...current, levelId: event.target.value }))
              }
            >
              <option value="">
                {'\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0443\u0440\u043e\u0432\u0435\u043d\u044c'}
              </option>
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field__label">
              {'\u0414\u0430\u0442\u0430 \u043f\u0440\u043e\u0432\u0435\u0434\u0435\u043d\u0438\u044f'}
            </span>
            <input
              className="field__input"
              type="date"
              value={form.eventDate}
              onChange={(event) =>
                setForm((current) => ({ ...current, eventDate: event.target.value }))
              }
            />
          </label>

          <label className="field">
            <span className="field__label">
              {'\u041c\u0435\u0441\u0442\u043e \u043f\u0440\u043e\u0432\u0435\u0434\u0435\u043d\u0438\u044f'}
            </span>
            <input
              className="field__input"
              value={form.location}
              onChange={(event) =>
                setForm((current) => ({ ...current, location: event.target.value }))
              }
            />
          </label>

          <label className="field">
            <span className="field__label">
              {'\u041d\u0430\u0438\u043c\u0435\u043d\u043e\u0432\u0430\u043d\u0438\u0435 \u043c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u044f'}
            </span>
            <input
              className="field__input"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
            />
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
                : editingEvent
                  ? '\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c'
                  : '\u0421\u043e\u0437\u0434\u0430\u0442\u044c'}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
