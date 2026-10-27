# Manual Exercise Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a validated manual exercise option with name, duration, and calories to the existing exercise form.

**Architecture:** A focused submission helper validates and builds the existing server-action payload. The existing client view model uses that helper, and the form conditionally renders a name input for manual exercises.

**Tech Stack:** Next.js 16, React 19, TypeScript, node:test.

## Global Constraints

- Keep the existing `addExerciseAction` payload contract unchanged.
- Preserve step-count calculation and preconfigured exercise estimation.
- Manual entries must have a non-empty name and positive duration.

---

### Task 1: Validate manual exercise submissions

**Files:**
- Create: `src/lib/exercise-submission.ts`
- Create: `tests/exercise-submission.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `buildExerciseSubmission(input)` returning `{ name, duration_minutes, calories_burned }` or throwing a Turkish validation error.

- [x] **Step 1: Write the failing test**

```js
const result = buildExerciseSubmission({
  exerciseType: 'Manuel',
  manualName: ' Kürek ergometresi ',
  durationMinutes: '35',
  burnedCalories: '280',
});
assert.deepEqual(result, { name: 'Kürek ergometresi', duration_minutes: 35, calories_burned: 280 });
```

- [x] **Step 2: Run test to verify it fails**

Run: `npm run test:exercise`
Expected: FAIL because the submission helper does not exist.

- [x] **Step 3: Write minimal implementation**

```ts
export function buildExerciseSubmission(input: ExerciseSubmissionInput) {
  const name = input.exerciseType === 'Manuel' ? input.manualName.trim() : input.exerciseType;
  if (!name) throw new Error('Egzersiz adı zorunludur.');
  // validate duration and calories, then return the existing action payload
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `npm run test:exercise`
Expected: PASS.

### Task 2: Connect manual fields to the exercise sheet

**Files:**
- Modify: `src/viewmodels/useAddExerciseViewModel.ts`
- Modify: `src/components/forms/AddExerciseForm.tsx`

**Interfaces:**
- Consumes: `buildExerciseSubmission(input)` from Task 1.
- Produces: A `Manuel` selector option and visible manual name field, then submits the validated payload to `addExerciseAction`.

- [x] **Step 1: Add manual name state and submit integration**

```ts
const payload = buildExerciseSubmission({ exerciseType, manualName, durationMinutes, burnedCalories });
await addExerciseAction({ date, ...payload });
```

- [x] **Step 2: Render the manual option and named field**

```tsx
<option value="Manuel">Manuel giriş</option>
{exerciseType === 'Manuel' && <input required value={manualName} onChange={...} />}
```

- [x] **Step 3: Verify typecheck and build**

Run: `npx tsc --noEmit && npm run build`
Expected: both commands exit successfully.

## Verification outcome

- `npm run test:exercise`: 2 passing tests.
- `npx tsc --noEmit`: exits successfully.
- `npm run build`: completed successfully with webpack.
