# Manual Food Storage and Label Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Manual Entry a personal-database save choice and working camera/gallery nutrition-label OCR actions.

**Architecture:** A pure helper creates a normalized FoodCache payload and image-input attributes. The existing meal form uses it before calling the existing manual-food route and uses two permanently mounted file inputs for OCR.

**Tech Stack:** Next.js 16, React 19, TypeScript, Mongoose, node:test.

## Global Constraints

- Keep manual entries database-free by default.
- Reuse `/api/food/manual` and `/api/food/ocr` with the current session authorization.
- Keep camera and gallery as visible, touch-friendly separate actions.

---

### Task 1: Build normalized manual-food storage data

**Files:**
- Create: `src/lib/manual-food-storage.ts`
- Create: `tests/manual-food-storage.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `buildManualFoodStoragePayload(input)` and `getFoodLabelInputAttributes(source)`.

- [x] **Step 1: Write a failing test**

```js
assert.deepEqual(buildManualFoodStoragePayload({
  foodName: 'Mercimek çorbası', brandName: '', unitType: 'gram', quantity: '250',
  calories: '500', protein: '20', carbs: '60', fat: '15', sugar: '5',
}).calories, 200);
assert.equal(getFoodLabelInputAttributes('gallery').capture, undefined);
```

- [x] **Step 2: Run the test and verify it fails**

Run: `npm run test:manual-food`
Expected: FAIL because the helper module does not exist.

- [x] **Step 3: Implement the helper**

```ts
const scale = unitType === 'gram' ? 100 / quantity : 1 / quantity;
return { food_name: foodName.trim(), calories: calories * scale, ... };
```

- [x] **Step 4: Run the test and verify it passes**

Run: `npm run test:manual-food`
Expected: PASS.

### Task 2: Connect storage choice and persistent OCR inputs

**Files:**
- Modify: `src/components/forms/AddMealForm.tsx`
- Modify: `src/viewmodels/useAddMealViewModel.ts`
- Modify: `src/models/FoodCache.ts`

**Interfaces:**
- Consumes: `buildManualFoodStoragePayload` and `getFoodLabelInputAttributes`.
- Produces: Manual Entry controls for database save, camera scan, and gallery selection.

- [x] **Step 1: Mount camera and gallery inputs at form scope**

```tsx
<input ref={cameraInputRef} {...getFoodLabelInputAttributes('camera')} onChange={...} />
<input ref={galleryInputRef} {...getFoodLabelInputAttributes('gallery')} onChange={...} />
```

- [x] **Step 2: Save FoodCache conditionally before DailyLog**

```ts
const saved = saveToDatabase ? await fetch('/api/food/manual', { body: JSON.stringify(payload) }) : null;
await handleSubmit(event, { foodCacheId: saved?.food.id });
```

- [x] **Step 3: Allow every manually selectable unit in FoodCache**

```ts
unit_type: { enum: ['gram', 'adet', 'porsiyon', 'dilim', 'avuç', ...] }
```

- [x] **Step 4: Verify focused tests and build**

Run: `npm run test:manual-food && npm run test:ocr && npx tsc --noEmit && npm run build`
Expected: all commands exit successfully.

## Verification outcome

- `npm run test:manual-food`: 3 passing tests.
- `npm run test:ocr`: 8 passing tests.
- `npx tsc --noEmit`: exits successfully.
- `npm run build`: completed successfully with webpack.
