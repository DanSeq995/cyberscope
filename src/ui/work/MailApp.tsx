import { useState } from 'react'

import { inbox, useWorkStore } from '@/state/work'

/** Posta del sistemista: elenco a sinistra, mail aperta a destra. Aprire la richiesta avvia il lavoro. */
export function MailApp({ onOpenSimulator }: { onOpenSimulator: () => void }) {
  const phase = useWorkStore((s) => s.phase)
  const read = useWorkStore((s) => s.read)
  const openMail = useWorkStore((s) => s.openMail)
  const mails = inbox(phase)
  const [openId, setOpenId] = useState<string | null>(null)
  const mail = mails.find((m) => m.id === openId)

  const open = (id: string) => {
    setOpenId(id)
    openMail(id)
  }

  return (
    <div className="flex min-h-0 flex-1 bg-white">
      <ul className="w-80 shrink-0 overflow-y-auto border-r border-slate-200 bg-slate-50">
        <li className="border-b border-slate-200 px-4 py-2 text-xs font-bold tracking-wide text-slate-500 uppercase">
          Posta in arrivo
        </li>
        {mails.map((m) => {
          const unread = !read.includes(m.id)
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => open(m.id)}
                className={`block w-full cursor-pointer border-b border-slate-200 px-4 py-3 text-left ${
                  m.id === openId ? 'bg-sky-100' : 'hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between text-sm">
                  <span className={unread ? 'font-bold text-slate-900' : 'text-slate-700'}>
                    {unread && <span className="mr-1.5 inline-block size-2 rounded-full bg-sky-600" />}
                    {m.from}
                  </span>
                  <span className="text-xs text-slate-500">{m.time}</span>
                </div>
                <div className={`truncate text-sm ${unread ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                  {m.subject}
                </div>
              </button>
            </li>
          )
        })}
      </ul>

      {mail ? (
        <article className="min-w-0 flex-1 overflow-y-auto px-8 py-6 select-text">
          <h2 className="text-xl font-semibold text-slate-900">{mail.subject}</h2>
          <p className="mt-1 mb-5 border-b border-slate-200 pb-4 text-sm text-slate-500">
            Da <b className="text-slate-700">{mail.from}</b> ({mail.role}) · oggi alle {mail.time}
          </p>
          <div className="max-w-3xl space-y-3 leading-relaxed text-slate-800">
            {mail.body.map((line) =>
              line.startsWith('- ') ? (
                <p key={line} className="ml-4 border-l-2 border-sky-300 pl-3">
                  {line.slice(2)}
                </p>
              ) : (
                <p key={line}>{line}</p>
              ),
            )}
          </div>
          {phase !== 'done' && (
            <button
              type="button"
              onClick={onOpenSimulator}
              className="mt-6 cursor-pointer rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
            >
              Apri il Simulatore di rete
            </button>
          )}
        </article>
      ) : (
        <div className="grid flex-1 place-items-center text-slate-400">Seleziona una mail per leggerla</div>
      )}
    </div>
  )
}
