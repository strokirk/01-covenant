import { Show, createSignal } from 'solid-js'
import { covenant, replaceCovenant } from '../store.ts'
import { sanitize, shareUrl } from '../share.ts'
import type { Covenant } from '../types.ts'

function fileName(name: string): string {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return `${slug || 'covenant'}.json`
}

export function CovenantActions() {
  const [status, setStatus] = createSignal('')
  let fileInput!: HTMLInputElement

  const announce = (message: string) => {
    setStatus(message)
    setTimeout(() => setStatus(''), 4000)
  }

  const copyLink = async () => {
    const url = shareUrl(covenant)
    // Keep the address bar in step so the link is also copyable from there.
    history.replaceState(null, '', url)
    try {
      await navigator.clipboard.writeText(url)
      announce('Share link copied')
    } catch {
      announce('Share link is now in the address bar')
    }
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(covenant, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName(covenant.name)
    link.click()
    URL.revokeObjectURL(url)
    announce('Exported')
  }

  const importJson = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as Partial<Covenant>
      replaceCovenant(sanitize(parsed))
      announce('Imported')
    } catch {
      announce("That file isn't a covenant")
    }
  }

  return (
    <div class="actions">
      <button type="button" onClick={copyLink}>
        Copy share link
      </button>
      <button type="button" onClick={exportJson}>
        Export
      </button>
      <button type="button" onClick={() => fileInput.click()}>
        Import
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        class="visually-hidden"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          if (file) void importJson(file)
          // Reset so re-picking the same file fires change again.
          event.currentTarget.value = ''
        }}
      />
      <Show when={status()}>
        <span class="actions-status" role="status">
          {status()}
        </span>
      </Show>
    </div>
  )
}
