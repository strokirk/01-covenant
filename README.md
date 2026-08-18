# Covenant Builder

A web app for building and designing covenants (wizards' communities) for
the *Ars Magica* 5th Edition tabletop RPG, built with TypeScript and
SolidJS. Published as a GitHub Pages site.

## Repo layout

- `app/` — the SolidJS + TypeScript + Vite web app.
- `reference/` — *Ars Magica* rulebook text (core rules + *Covenants*
  sourcebook) used as reference material while building the app. See
  [`reference/README.md`](reference/README.md) for licensing details.
- `.github/workflows/deploy.yml` — builds `app/` and deploys it to
  GitHub Pages on push to `main`.

## Development

```sh
cd app
npm install
npm run dev
```

## License

The app's own code is not yet licensed for reuse (add a `LICENSE` file
if/when that's decided). Rulebook reference material in `reference/` is
CC-BY-SA 4.0 licensed by Atlas Games — see
[`reference/README.md`](reference/README.md).
