# Project Rules

## Architecture: MVVM (Model-View-ViewModel)
This project follows the MVVM architectural pattern tailored for Next.js and React.

- **Models (`src/models/`)**: Defines interfaces, types, DTOs, and pure domain logic. Do not put React components or hooks here.
- **ViewModels (`src/viewmodels/`)**: Contains custom React hooks (e.g., `useUserViewModel.ts`) that manage state, side effects, and connect Models to Views. Keep business logic out of UI components.
- **Views (`src/app/` and `src/components/`)**: React components responsible ONLY for UI rendering and user interactions. Views should delegate logic to ViewModels.

## Localization (i18n)
All user-facing text MUST be localized.
- Do not hardcode strings in UI components.
- Use the translation helper from `src/lib/i18n.ts`.
- Add all new strings to `src/locales/tr.json` (Primary language: Turkish). English (`en.json`) may be added in the future.

## Design System & Styling
- All spacing, sizing, and typography rules MUST be defined centrally in `src/app/globals.css` using CSS variables (e.g., `--size-button-h`, `--font-headline`).
- **Typography**: Always use semantic typography variables (`text-[var(--font-headline)]`, `text-[var(--font-subtitle)]`, `text-[var(--font-caption)]`).
- **Responsive Sizing**: Use `clamp()` for fluid sizing in CSS variables to ensure components adapt smoothly to different screen sizes without writing multiple media queries.
- Do NOT use arbitrary, hardcoded values (like `w-[300px]` or `h-[45px]`) inside components. Use the centralized design system tokens.
