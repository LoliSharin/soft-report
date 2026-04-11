import { useEffect, useState } from 'react';

import type { DesktopApi } from '../../../shared/desktop.types';
import type { Note } from '../../../shared/note.types';

interface NotesPanelProps {
  desktopApi: DesktopApi;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function NotesPanel({ desktopApi }: NotesPanelProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadNotes(): Promise<void> {
      try {
        const items = await desktopApi.notes.list();

        if (!cancelled) {
          setNotes(items);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Failed to load notes.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadNotes();

    return () => {
      cancelled = true;
    };
  }, [desktopApi]);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    const nextTitle = title.trim();

    if (!nextTitle) {
      setError('Enter a note title.');
      return;
    }

    try {
      const createdNote = await desktopApi.notes.create({ title: nextTitle });
      setNotes((currentNotes) => [createdNote, ...currentNotes]);
      setTitle('');
      setError(null);
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : 'Failed to create note.',
      );
    }
  }

  return (
    <section className="notes-panel">
      <div className="notes-panel__header">
        <div>
          <p className="notes-panel__eyebrow">SQLite Demo</p>
          <h2 className="notes-panel__title">Notes from the local database</h2>
        </div>
      </div>

      <form className="notes-form" onSubmit={handleSubmit}>
        <input
          className="notes-form__input"
          placeholder="Note title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <button className="primary-button notes-form__button" type="submit">
          Add note
        </button>
      </form>

      {error ? <p className="notes-panel__error">{error}</p> : null}

      {isLoading ? <p className="notes-panel__status">Loading...</p> : null}

      {!isLoading && notes.length === 0 ? (
        <p className="notes-panel__status">
          There are no notes yet. Add the first one above.
        </p>
      ) : null}

      <div className="notes-list">
        {notes.map((note) => (
          <article className="note-card" key={note.id}>
            <strong className="note-card__title">{note.title}</strong>
            <span className="note-card__date">{formatDate(note.createdAt)}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
