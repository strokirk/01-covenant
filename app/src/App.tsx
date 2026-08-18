import { For, Show, createMemo, createSignal } from 'solid-js'
import './App.css'
import { BalanceBar } from './components/BalanceBar.tsx'
import { CovenantActions } from './components/CovenantActions.tsx'
import { OptionCard } from './components/OptionCard.tsx'
import { SelectionSummary } from './components/SelectionSummary.tsx'
import { SituationPicker } from './components/SituationPicker.tsx'
import { ConstructionPanel } from './components/ConstructionPanel.tsx'
import { WealthPanel } from './components/WealthPanel.tsx'
import { Button } from './components/ui/Button.tsx'
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

type View = 'boons' | 'wealth' | 'building'

function App() {
  const [view, setView] = createSignal<View>('boons')
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
          <p>Ars Magica 5th Edition</p>
        </div>
        <div class="masthead-controls">
          <input
            class="field covenant-name"
            type="text"
            placeholder="Name your covenant…"
            value={covenant.name}
            onInput={(event) => setCovenant('name', event.currentTarget.value)}
            aria-label="Covenant name"
          />
          <CovenantActions />
        </div>
      </header>

      <nav class="views" aria-label="Sections">
        <Button variant="bare" class="view-tab" active={view() === 'boons'} onClick={() => setView('boons')}>
          Boons &amp; Hooks
        </Button>
        <Button variant="bare" class="view-tab" active={view() === 'wealth'} onClick={() => setView('wealth')}>
          Wealth
        </Button>
        <Button
          variant="bare"
          class="view-tab"
          active={view() === 'building'}
          onClick={() => setView('building')}
        >
          Building
        </Button>
      </nav>

      <Show when={view() === 'wealth'}>
        <WealthPanel />
      </Show>

      <Show when={view() === 'building'}>
        <ConstructionPanel />
      </Show>

      <Show when={view() === 'boons'}>
        <BalanceBar />
        <SituationPicker />

        <div class="layout">
          <main class="picker">
            <div class="toolbar">
            <input
              class="field search"
              type="search"
              placeholder="Search all options…"
              value={search()}
              onInput={(event) => setSearch(event.currentTarget.value)}
              aria-label="Search options"
            />
            <div class="kind-filter" role="group" aria-label="Filter by type">
              <For each={kindFilters}>
                {(filter) => (
                  <Button active={kind() === filter.id} onClick={() => setKind(filter.id)}>
                    {filter.label}
                  </Button>
                )}
              </For>
            </div>
          </div>

          <nav class="tabs" aria-label="Categories">
            <For each={categories}>
              {(entry) => (
                <Button
                  active={category() === entry.id && !search().trim()}
                  onClick={() => {
                    setSearch('')
                    setCategory(entry.id)
                  }}
                >
                  {entry.label}
                </Button>
              )}
            </For>
          </nav>

          <Show when={search().trim()}>
            <p class="search-note">
              Showing matches across all categories.{' '}
              <Button variant="link" onClick={() => setSearch('')}>
                Clear search
              </Button>
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
      </Show>

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
