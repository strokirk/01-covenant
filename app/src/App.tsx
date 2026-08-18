import { For, Show, createMemo, createSignal } from 'solid-js'
import './App.css'
import { BalanceBar } from './components/BalanceBar.tsx'
import { CovenantActions } from './components/CovenantActions.tsx'
import { OptionCard } from './components/OptionCard.tsx'
import { SelectionSummary } from './components/SelectionSummary.tsx'
import { SituationPicker } from './components/SituationPicker.tsx'
import { categories, compareOptions, options } from './data.ts'
import { covenant, setCovenant } from './store.ts'
import type { CategoryId, Kind } from './types.ts'

type KindFilter = Kind | 'all'

const kindFilters: { id: KindFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'boon', label: 'Boons' },
  { id: 'hook', label: 'Hooks' },
  { id: 'free', label: 'Free Choices' },
]

function App() {
  const [category, setCategory] = createSignal<CategoryId>('site')
  const [kind, setKind] = createSignal<KindFilter>('all')
  const [search, setSearch] = createSignal('')

  const visible = createMemo(() => {
    const term = search().trim().toLowerCase()
    return options
      .filter((option) => {
        // A search reaches across every category; otherwise stay in the tab.
        if (!term && option.category !== category()) return false
        if (kind() !== 'all' && option.kind !== kind()) return false
        if (!term) return true
        return (
          option.name.toLowerCase().includes(term) ||
          option.description.toLowerCase().includes(term)
        )
      })
      .sort(compareOptions)
  })

  return (
    <div class="app">
      <header class="masthead">
        <div class="masthead-title">
          <h1>Covenant Builder</h1>
          <p>Boons &amp; Hooks for Ars Magica 5th Edition</p>
        </div>
        <div class="masthead-controls">
          <input
            class="covenant-name"
            type="text"
            placeholder="Name your covenant…"
            value={covenant.name}
            onInput={(event) => setCovenant('name', event.currentTarget.value)}
            aria-label="Covenant name"
          />
          <CovenantActions />
        </div>
      </header>

      <BalanceBar />
      <SituationPicker />

      <div class="layout">
        <main class="picker">
          <div class="toolbar">
            <input
              class="search"
              type="search"
              placeholder="Search all options…"
              value={search()}
              onInput={(event) => setSearch(event.currentTarget.value)}
              aria-label="Search options"
            />
            <div class="kind-filter" role="group" aria-label="Filter by type">
              <For each={kindFilters}>
                {(filter) => (
                  <button
                    type="button"
                    classList={{ 'is-active': kind() === filter.id }}
                    onClick={() => setKind(filter.id)}
                  >
                    {filter.label}
                  </button>
                )}
              </For>
            </div>
          </div>

          <nav class="tabs" aria-label="Categories">
            <For each={categories}>
              {(entry) => (
                <button
                  type="button"
                  classList={{ 'is-active': category() === entry.id && !search().trim() }}
                  onClick={() => {
                    setSearch('')
                    setCategory(entry.id)
                  }}
                >
                  {entry.label}
                </button>
              )}
            </For>
          </nav>

          <Show when={search().trim()}>
            <p class="search-note">
              Showing matches across all categories.{' '}
              <button type="button" class="link-button" onClick={() => setSearch('')}>
                Clear search
              </button>
            </p>
          </Show>

          <Show
            when={visible().length > 0}
            fallback={<p class="empty">No options match that search.</p>}
          >
            <ul class="option-list">
              <For each={visible()}>{(option) => <OptionCard option={option} />}</For>
            </ul>
          </Show>
        </main>

        <SelectionSummary />
      </div>

      <footer class="colophon">
        <p>
          Rules text based on material for Ars Magica, © 1993–2024, licensed by Trident, Inc. d/b/a
          Atlas Games, under the{' '}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/" rel="license">
            Creative Commons Attribution-ShareAlike 4.0 International license
          </a>
          . See the{' '}
          <a href="https://www.atlas-games.com/arsmagica/openars">Ars Magica Open License</a>.
        </p>
      </footer>
    </div>
  )
}

export default App
