import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

import type { DictionaryRecord } from '../../../shared/dictionary.types';
import type { EventRecord } from '../../../shared/event.types';
import type { ParticipantRecord } from '../../../shared/participant.types';
import type {
  ParticipationCertificatePreview,
  ParticipationCertificateSelection,
  ParticipationRecord,
} from '../../../shared/participation.types';

import type { ScreenProps } from '../../app/screen.types';
import { getErrorMessage } from '../../logic/get-error-message';
import { Modal } from '../components/Modal';

interface ParticipationFormState {
  eventId: string;
  participantId: string;
  supervisorId: string;
  resultId: string;
  notes: string;
  certificateSourcePath: string;
  certificateFileName: string;
  clearCertificateImage: boolean;
}

const emptyForm: ParticipationFormState = {
  eventId: '',
  participantId: '',
  supervisorId: '',
  resultId: '',
  notes: '',
  certificateSourcePath: '',
  certificateFileName: '',
  clearCertificateImage: false,
};

function getParticipantTypeLabel(type: 'teacher' | 'student'): string {
  return type === 'teacher'
    ? '\u041f\u0440\u0435\u043f\u043e\u0434\u0430\u0432\u0430\u0442\u0435\u043b\u044c'
    : '\u0421\u0442\u0443\u0434\u0435\u043d\u0442';
}

export function ParticipationsScreen({ api, notify }: ScreenProps) {
  const [participations, setParticipations] = useState<ParticipationRecord[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [participants, setParticipants] = useState<ParticipantRecord[]>([]);
  const [results, setResults] = useState<DictionaryRecord[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preview, setPreview] = useState<ParticipationCertificatePreview | null>(
    null,
  );
  const [previewRecordId, setPreviewRecordId] = useState<number | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [editingRecord, setEditingRecord] =
    useState<ParticipationRecord | null>(null);
  const [form, setForm] = useState<ParticipationFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  async function loadData(): Promise<void> {
    setIsLoading(true);

    try {
      const [participationRows, eventRows, participantRows, resultRows] =
        await Promise.all([
          api.participations.list(),
          api.events.list(),
          api.participants.list(),
          api.dictionaries.list('participation_result'),
        ]);

      setParticipations(participationRows);
      setEvents(eventRows);
      setParticipants(participantRows);
      setResults(resultRows.filter((item) => item.isActive));
    } catch (loadError) {
      notify(
        'error',
        getErrorMessage(
          loadError,
          '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u0437\u0430\u043f\u0438\u0441\u0438 \u0443\u0447\u0430\u0441\u0442\u0438\u044f.',
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const selectedParticipant = participants.find(
    (participant) => String(participant.id) === form.participantId,
  );
  const teacherOptions = participants.filter(
    (participant) => participant.participantType === 'teacher',
  );
  const hasStoredCertificateImage =
    Boolean(editingRecord?.certificateImageName) &&
    !form.clearCertificateImage &&
    !form.certificateSourcePath;

  function openCreateModal(): void {
    setEditingRecord(null);
    setForm(emptyForm);
    setFormError(null);
    setIsModalOpen(true);
  }

  function openEditModal(record: ParticipationRecord): void {
    setEditingRecord(record);
    setForm({
      eventId: String(record.eventId),
      participantId: String(record.participantId),
      supervisorId: record.supervisorId ? String(record.supervisorId) : '',
      resultId: String(record.resultId),
      notes: record.notes ?? '',
      certificateSourcePath: '',
      certificateFileName: record.certificateImageName ?? '',
      clearCertificateImage: false,
    });
    setFormError(null);
    setIsModalOpen(true);
  }

  function closeModal(): void {
    setIsModalOpen(false);
    setEditingRecord(null);
    setForm(emptyForm);
    setFormError(null);
  }

  function closePreviewModal(): void {
    setPreview(null);
    setPreviewRecordId(null);
    setIsPreviewLoading(false);
    setIsDownloading(false);
  }

  async function handleSelectCertificateImage(): Promise<void> {
    try {
      const selection =
        await api.participations.selectCertificateImage();

      if (!selection) {
        return;
      }

      setForm((current) => ({
        ...current,
        certificateSourcePath: selection.sourcePath,
        certificateFileName: selection.fileName,
        clearCertificateImage: false,
      }));
    } catch (selectionError) {
      notify(
        'error',
        getErrorMessage(
          selectionError,
          '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0432\u044b\u0431\u0440\u0430\u0442\u044c \u0444\u043e\u0442\u043e \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043a\u0430\u0442\u0430.',
        ),
      );
    }
  }

  function handleClearCertificateImage(): void {
    setForm((current) => ({
      ...current,
      certificateSourcePath: '',
      certificateFileName: '',
      clearCertificateImage: Boolean(editingRecord?.certificateImageName),
    }));
  }

  async function handleOpenCertificateImage(recordId: number): Promise<void> {
    try {
      setIsPreviewLoading(true);
      setPreviewRecordId(recordId);
      const previewData = await api.participations.getCertificatePreview(recordId);
      setPreview(previewData);
    } catch (openError) {
      closePreviewModal();
      notify(
        'error',
        getErrorMessage(
          openError,
          '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u0444\u043e\u0442\u043e \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043a\u0430\u0442\u0430.',
        ),
      );
    } finally {
      setIsPreviewLoading(false);
    }
  }

  async function handleDownloadCertificateImage(): Promise<void> {
    if (!previewRecordId) {
      return;
    }

    try {
      setIsDownloading(true);
      const filePath = await api.participations.downloadCertificateImage(
        previewRecordId,
      );

      if (!filePath) {
        return;
      }

      notify(
        'success',
        `\u0424\u043e\u0442\u043e \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043a\u0430\u0442\u0430 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u043e: ${filePath}`,
      );
    } catch (downloadError) {
      notify(
        'error',
        getErrorMessage(
          downloadError,
          '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0441\u043a\u0430\u0447\u0430\u0442\u044c \u0444\u043e\u0442\u043e \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043a\u0430\u0442\u0430.',
        ),
      );
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!form.eventId || !form.participantId || !form.resultId) {
      setFormError(
        '\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u0435, \u0443\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u0430 \u0438 \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442.',
      );
      return;
    }

    if (selectedParticipant?.participantType === 'student' && !form.supervisorId) {
      setFormError(
        '\u0414\u043b\u044f \u0443\u0447\u0430\u0441\u0442\u0438\u044f \u0441\u0442\u0443\u0434\u0435\u043d\u0442\u0430 \u0440\u0443\u043a\u043e\u0432\u043e\u0434\u0438\u0442\u0435\u043b\u044c \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u0435\u043d.',
      );
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const payload = {
        eventId: Number(form.eventId),
        participantId: Number(form.participantId),
        supervisorId: form.supervisorId ? Number(form.supervisorId) : null,
        resultId: Number(form.resultId),
        notes: form.notes,
        certificateSourcePath: form.certificateSourcePath || undefined,
        clearCertificateImage: form.clearCertificateImage,
      };

      if (editingRecord) {
        await api.participations.update(editingRecord.id, payload);
        notify(
          'success',
          '\u0417\u0430\u043f\u0438\u0441\u044c \u0443\u0447\u0430\u0441\u0442\u0438\u044f \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u0430.',
        );
      } else {
        await api.participations.create(payload);
        notify(
          'success',
          '\u0417\u0430\u043f\u0438\u0441\u044c \u0443\u0447\u0430\u0441\u0442\u0438\u044f \u0441\u043e\u0437\u0434\u0430\u043d\u0430.',
        );
      }

      closeModal();
      await loadData();
    } catch (submitError) {
      setFormError(
        getErrorMessage(
          submitError,
          '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0441\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u0437\u0430\u043f\u0438\u0441\u044c \u0443\u0447\u0430\u0441\u0442\u0438\u044f.',
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(recordId: number): Promise<void> {
    if (
      !window.confirm(
        '\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u044d\u0442\u0443 \u0437\u0430\u043f\u0438\u0441\u044c \u0443\u0447\u0430\u0441\u0442\u0438\u044f?',
      )
    ) {
      return;
    }

    try {
      await api.participations.delete(recordId);
      notify(
        'success',
        '\u0417\u0430\u043f\u0438\u0441\u044c \u0443\u0447\u0430\u0441\u0442\u0438\u044f \u0443\u0434\u0430\u043b\u0435\u043d\u0430.',
      );
      await loadData();
    } catch (deleteError) {
      notify(
        'error',
        getErrorMessage(
          deleteError,
          '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0443\u0434\u0430\u043b\u0438\u0442\u044c \u0437\u0430\u043f\u0438\u0441\u044c \u0443\u0447\u0430\u0441\u0442\u0438\u044f.',
        ),
      );
    }
  }

  const filteredRecords = participations
    .filter((record) => {
    const haystack = [
      record.eventTitle,
      record.participantName,
      record.supervisorName ?? '',
      record.resultLabel,
      record.eventLevelLabel,
    ]
      .join(' ')
      .toLowerCase();

      return haystack.includes(query.trim().toLowerCase());
    })
    .sort((left, right) =>
      left.participantName.localeCompare(right.participantName, 'ru-RU'),
    );

  return (
    <section className="screen-card">
      <header className="screen-card__header">
        <div>
          <p className="screen-card__eyebrow">{'\u0421\u0432\u044f\u0437\u0438'}</p>
          <h2 className="screen-card__title">
            {'\u0423\u0447\u0430\u0441\u0442\u0438\u0435 \u0432 \u043c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u044f\u0445'}
          </h2>
        </div>
        <button
          className="button button--primary"
          onClick={openCreateModal}
          type="button"
        >
          {'\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0443\u0447\u0430\u0441\u0442\u0438\u0435'}
        </button>
      </header>

      <div className="toolbar">
        <input
          className="field__input"
          placeholder={
            '\u041f\u043e\u0438\u0441\u043a \u043f\u043e \u043c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u044e, \u0443\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u0443, \u0440\u0443\u043a\u043e\u0432\u043e\u0434\u0438\u0442\u0435\u043b\u044e \u0438\u043b\u0438 \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u0443'
          }
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="table-shell">
        <table className="data-table">
          <thead>
            <tr>
              <th>{'\u041c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u0435'}</th>
              <th>{'\u0423\u0447\u0430\u0441\u0442\u043d\u0438\u043a'}</th>
              <th>{'\u0420\u0443\u043a\u043e\u0432\u043e\u0434\u0438\u0442\u0435\u043b\u044c'}</th>
              <th>{'\u0420\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442'}</th>
              <th>{'\u041f\u0440\u0438\u043c\u0435\u0447\u0430\u043d\u0438\u0435'}</th>
              <th className="actions-cell">
                {'\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044f'}
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6}>{'\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430...'}</td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  {'\u0417\u0430\u043f\u0438\u0441\u0438 \u0443\u0447\u0430\u0441\u0442\u0438\u044f \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u044b.'}
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => (
                <tr key={record.id}>
                  <td>
                    <strong>{record.eventTitle}</strong>
                    <div className="table-meta">
                      {record.eventLevelLabel}, {record.eventDate}
                    </div>
                  </td>
                  <td>{record.participantName}</td>
                  <td>{record.supervisorName ?? '-'}</td>
                  <td>{record.resultLabel}</td>
                  <td>{record.notes ?? '-'}</td>
                  <td className="actions-cell">
                    {record.certificateImageName ? (
                      <button
                        className="button button--ghost"
                        onClick={() => handleOpenCertificateImage(record.id)}
                        type="button"
                      >
                        {
                          '\u0424\u043e\u0442\u043e'
                        }
                      </button>
                    ) : null}
                    <button
                      className="button button--ghost"
                      onClick={() => openEditModal(record)}
                      type="button"
                    >
                      {'\u0418\u0437\u043c\u0435\u043d\u0438\u0442\u044c'}
                    </button>
                    <button
                      className="button button--danger"
                      onClick={() => handleDelete(record.id)}
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
          editingRecord
            ? '\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435 \u0443\u0447\u0430\u0441\u0442\u0438\u044f'
            : '\u0421\u043e\u0437\u0434\u0430\u043d\u0438\u0435 \u0443\u0447\u0430\u0441\u0442\u0438\u044f'
        }
        onClose={closeModal}
      >
        <form className="modal-form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field__label">
              {'\u041c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u0435'}
            </span>
            <select
              className="field__input"
              value={form.eventId}
              onChange={(event) =>
                setForm((current) => ({ ...current, eventId: event.target.value }))
              }
            >
              <option value="">
                {'\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u0435'}
              </option>
              {events.map((eventRecord) => (
                <option key={eventRecord.id} value={eventRecord.id}>
                  {eventRecord.title} ({eventRecord.eventDate})
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field__label">{'\u0423\u0447\u0430\u0441\u0442\u043d\u0438\u043a'}</span>
            <select
              className="field__input"
              value={form.participantId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  participantId: event.target.value,
                  supervisorId: '',
                }))
              }
            >
              <option value="">
                {'\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0443\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u0430'}
              </option>
              {participants.map((participant) => (
                <option key={participant.id} value={participant.id}>
                  {participant.fullName} ({getParticipantTypeLabel(participant.participantType)})
                </option>
              ))}
            </select>
          </label>

          {selectedParticipant?.participantType === 'student' ? (
            <label className="field">
              <span className="field__label">
                {'\u0420\u0443\u043a\u043e\u0432\u043e\u0434\u0438\u0442\u0435\u043b\u044c'}
              </span>
              <select
                className="field__input"
                value={form.supervisorId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    supervisorId: event.target.value,
                  }))
                }
              >
                <option value="">
                  {'\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0440\u0443\u043a\u043e\u0432\u043e\u0434\u0438\u0442\u0435\u043b\u044f'}
                </option>
                {teacherOptions.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.fullName}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="field">
            <span className="field__label">{'\u0420\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442'}</span>
            <select
              className="field__input"
              value={form.resultId}
              onChange={(event) =>
                setForm((current) => ({ ...current, resultId: event.target.value }))
              }
            >
              <option value="">
                {'\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442'}
              </option>
              {results.map((result) => (
                <option key={result.id} value={result.id}>
                  {result.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field__label">
              {'\u041f\u0440\u0438\u043c\u0435\u0447\u0430\u043d\u0438\u0435'}
            </span>
            <textarea
              className="field__input field__input--textarea"
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
            />
          </label>

          <div className="field">
            <span className="field__label">
              {'\u0424\u043e\u0442\u043e \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043a\u0430\u0442\u0430'}
            </span>
            <div className="attachment-panel">
              <div className="attachment-panel__summary">
                {form.certificateFileName ? (
                  <span>{form.certificateFileName}</span>
                ) : (
                  <span className="attachment-panel__placeholder">
                    {
                      '\u0424\u0430\u0439\u043b \u0435\u0449\u0435 \u043d\u0435 \u043f\u0440\u0438\u043a\u0440\u0435\u043f\u043b\u0435\u043d.'
                    }
                  </span>
                )}
              </div>
              <div className="attachment-panel__actions">
                <button
                  className="button button--ghost"
                  onClick={() => {
                    void handleSelectCertificateImage();
                  }}
                  type="button"
                >
                  {form.certificateFileName
                    ? '\u0417\u0430\u043c\u0435\u043d\u0438\u0442\u044c \u0444\u043e\u0442\u043e'
                    : '\u0412\u044b\u0431\u0440\u0430\u0442\u044c \u0444\u043e\u0442\u043e'}
                </button>
                {hasStoredCertificateImage && editingRecord ? (
                <button
                  className="button button--ghost"
                  onClick={() => {
                      void handleOpenCertificateImage(editingRecord.id);
                    }}
                  type="button"
                >
                    {'\u041f\u0440\u043e\u0441\u043c\u043e\u0442\u0440'}
                  </button>
                ) : null}
                {form.certificateFileName ? (
                  <button
                    className="button button--danger"
                    onClick={handleClearCertificateImage}
                    type="button"
                  >
                    {'\u0423\u0431\u0440\u0430\u0442\u044c'}
                  </button>
                ) : null}
              </div>
            </div>
          </div>

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
                : editingRecord
                  ? '\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c'
                  : '\u0421\u043e\u0437\u0434\u0430\u0442\u044c'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(preview) || isPreviewLoading}
        title={'\u0424\u043e\u0442\u043e \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043a\u0430\u0442\u0430'}
        onClose={closePreviewModal}
      >
        <div className="certificate-preview">
          {isPreviewLoading ? (
            <p className="certificate-preview__status">
              {'\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u0438\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u044f...'}
            </p>
          ) : preview ? (
            <>
              <div className="certificate-preview__frame">
                <img
                  className="certificate-preview__image"
                  src={preview.dataUrl}
                  alt={
                    '\u0424\u043e\u0442\u043e \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043a\u0430\u0442\u0430'
                  }
                />
              </div>
              <p className="certificate-preview__file">{preview.fileName}</p>
              <div className="modal-form__actions">
                <button
                  className="button button--ghost"
                  onClick={closePreviewModal}
                  type="button"
                >
                  {'\u0417\u0430\u043a\u0440\u044b\u0442\u044c'}
                </button>
                <button
                  className="button button--primary"
                  onClick={() => {
                    void handleDownloadCertificateImage();
                  }}
                  type="button"
                >
                  {isDownloading
                    ? '\u0421\u043a\u0430\u0447\u0438\u0432\u0430\u043d\u0438\u0435...'
                    : '\u0421\u043a\u0430\u0447\u0430\u0442\u044c'}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </Modal>
    </section>
  );
}
