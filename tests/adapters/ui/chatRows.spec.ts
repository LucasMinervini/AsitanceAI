import { describe, it, expect } from 'vitest';
import { buildChatRows, formatDateLabel, type ChatRow } from '@adapters/ui/view-models/chatRows';
import type { ChatMessageVM } from '@adapters/ui/view-models/ChatViewModel';

const NOW = new Date('2026-06-28T15:00:00');

function vm(role: ChatMessageVM['role'], text: string, iso: string): ChatMessageVM {
  const date = new Date(iso);
  return { role, text, time: '00:00', createdAtMs: date.getTime() };
}

function messageRows(rows: readonly ChatRow[]) {
  return rows.filter((r): r is Extract<ChatRow, { kind: 'message' }> => r.kind === 'message');
}

describe('buildChatRows', () => {
  it('inserta un separador de fecha al inicio del día', () => {
    const rows = buildChatRows([vm('user', 'hola', '2026-06-28T10:00:00')], NOW);

    expect(rows[0]).toMatchObject({ kind: 'date', label: 'Hoy' });
    expect(rows[1]).toMatchObject({ kind: 'message', index: 0 });
  });

  it('agrupa mensajes consecutivos del mismo remitente (mismo día)', () => {
    const rows = buildChatRows(
      [
        vm('user', 'uno', '2026-06-28T10:00:00'),
        vm('user', 'dos', '2026-06-28T10:01:00'),
      ],
      NOW,
    );

    const msgs = messageRows(rows);
    expect(msgs).toHaveLength(2);
    expect(msgs[0]).toMatchObject({ groupStart: true, groupEnd: false });
    expect(msgs[1]).toMatchObject({ groupStart: false, groupEnd: true });
  });

  it('rompe el grupo cuando cambia el remitente', () => {
    const rows = buildChatRows(
      [
        vm('user', 'pregunta', '2026-06-28T10:00:00'),
        vm('assistant', 'respuesta', '2026-06-28T10:00:30'),
      ],
      NOW,
    );

    const msgs = messageRows(rows);
    expect(msgs[0]).toMatchObject({ groupStart: true, groupEnd: true });
    expect(msgs[1]).toMatchObject({ groupStart: true, groupEnd: true });
  });

  it('inserta un separador nuevo y rompe el grupo al cambiar de día', () => {
    const rows = buildChatRows(
      [
        vm('user', 'ayer', '2026-06-27T23:00:00'),
        vm('user', 'hoy', '2026-06-28T08:00:00'),
      ],
      NOW,
    );

    const dateRows = rows.filter((r) => r.kind === 'date');
    expect(dateRows.map((r) => (r.kind === 'date' ? r.label : ''))).toEqual(['Ayer', 'Hoy']);
    const msgs = messageRows(rows);
    expect(msgs[0]?.groupEnd).toBe(true);
    expect(msgs[1]?.groupStart).toBe(true);
  });
});

describe('formatDateLabel', () => {
  it('devuelve "Hoy" para la fecha de hoy', () => {
    expect(formatDateLabel(new Date('2026-06-28T09:00:00'), NOW)).toBe('Hoy');
  });

  it('devuelve "Ayer" para el día anterior', () => {
    expect(formatDateLabel(new Date('2026-06-27T09:00:00'), NOW)).toBe('Ayer');
  });

  it('devuelve la fecha d/m/aaaa para días más viejos', () => {
    expect(formatDateLabel(new Date('2026-06-20T09:00:00'), NOW)).toBe('20/6/2026');
  });
});
