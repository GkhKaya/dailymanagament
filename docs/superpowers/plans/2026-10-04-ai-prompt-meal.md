# AI Serbest Metin Öğün Hesaplama Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serbest metindeki tarif, porsiyon ve tüketim oranından AI ile besin değeri hesaplayıp kullanıcı onayıyla günlük öğüne eklemek.

**Architecture:** Ayrı bir API endpoint'i, mevcut tek besin sorgusundan bağımsız olarak promptu hesaplar ve yalnızca normalize edilmiş geçici öğün sonucunu döndürür. Form, sonucu düzenlenebilir önizleme olarak gösterir ve mevcut `addMealAction` ile `food_cache_id` olmadan DailyLog'a kaydeder.

**Tech Stack:** Next.js App Router route handlers, React client form, Google GenAI/OpenRouter fallback, Mongoose, Node test runner.

## Global Constraints

- Kullanıcı veritabanı kullanımı için açık/kapalı seçeneğini görür ve belirler.
- Kapalı seçenek FoodCache/SavedFood/recipe okumaz veya yazmaz.
- Açık seçenek yalnızca mevcut FoodCache kayıtlarını okur; hiçbir cache veya kayıtlı besin oluşturmaz/güncellemez.
- Sonuç, onaylanana kadar DailyLog'a yazılmaz.
- Günlük kayıtta `food_cache_id` her zaman `null` olur.
- Girdi 1-1.500 karakter, tüm makrolar sonlu ve sıfır veya büyük olmalıdır.

---

### Task 1: Prompt hesaplama sözleşmesi ve API endpoint'i

**Files:**
- Create: `src/lib/ai-prompt-meal.ts`
- Create: `src/app/api/food/prompt-meal/route.ts`
- Test: `tests/ai-prompt-meal.test.mjs`

**Interfaces:**
- Produces: `PromptMealResult` with `food_name`, `serving_description`, `quantity`, `unit_type`, `calculated`.
- Produces: `POST /api/food/prompt-meal` accepting `{ prompt: string, useDatabase: boolean }`.

- [ ] **Step 1: Write the failing parser/validation tests**

```js
test('accepts a free-text recipe and preserves fractional consumption', () => {
  const input = validatePromptMealRequest({
    prompt: '1 paket puding, yarım paket petibör ile yaptığım tatlının dörtte birini yedim',
    useDatabase: false,
  });
  assert.equal(input.prompt.includes('dörtte birini'), true);
  assert.equal(input.useDatabase, false);
});

test('rejects empty or overly long prompts', () => {
  assert.throws(() => validatePromptMealRequest({ prompt: '', useDatabase: false }));
  assert.throws(() => validatePromptMealRequest({ prompt: 'x'.repeat(1501), useDatabase: true }));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --test tests/ai-prompt-meal.test.mjs`

Expected: FAIL because `src/lib/ai-prompt-meal.ts` does not exist.

- [ ] **Step 3: Implement request/result guards and the endpoint**

```ts
export type PromptMealResult = {
  food_name: string;
  serving_description: string;
  quantity: number;
  unit_type: 'porsiyon';
  calculated: { calories: number; protein_g: number; carbs_g: number; fat_g: number; sugar_g: number };
  source: 'ai' | 'ai_with_database_context';
};

export function validatePromptMealRequest(value: unknown): { prompt: string; useDatabase: boolean } {
  // require an object, trim prompt, enforce 1..1500 length and boolean useDatabase
}
```

The route authenticates first. It queries FoodCache only when `useDatabase` is true, passes a capped read-only summary as optional model context, and never calls `create`, `update`, `save`, or `insert` on any food collection. Gemini returns a schema-constrained result; OpenRouter remains the fallback. Validate every returned macro before returning JSON.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --test tests/ai-prompt-meal.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai-prompt-meal.ts src/app/api/food/prompt-meal/route.ts tests/ai-prompt-meal.test.mjs
git commit -m "feat: add AI prompt meal endpoint"
```

### Task 2: Besin ekleme formu önizlemesi ve günlük kayıt

**Files:**
- Modify: `src/components/forms/AddMealForm.tsx`
- Test: `tests/ai-prompt-meal.test.mjs`

**Interfaces:**
- Consumes: `POST /api/food/prompt-meal` response `PromptMealResult`.
- Consumes: `addMealAction` with `food_cache_id` omitted.
- Produces: an AI prompt tab/section with a database toggle, preview, editing, and confirmation flow.

- [ ] **Step 1: Write the failing UI-contract tests**

```js
test('prompt meal persistence payload does not include a food cache id', () => {
  const payload = toMealEntryPayload(promptResult, '2026-10-04', 'dinner');
  assert.equal(payload.food_cache_id, undefined);
  assert.equal(payload.type, 'dinner');
  assert.equal(payload.food_name, 'Pudingli petibör tatlısı');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --test tests/ai-prompt-meal.test.mjs`

Expected: FAIL because `toMealEntryPayload` is not exported.

- [ ] **Step 3: Add the prompt UI and confirmation path**

```tsx
<textarea value={promptMealText} onChange={(event) => setPromptMealText(event.target.value)} />
<label>
  <input type="checkbox" checked={useDatabase} onChange={(event) => setUseDatabase(event.target.checked)} />
  Veritabanını kullan
</label>
```

Request the new endpoint only when the user explicitly presses `Hesapla`. Present food name, serving description and macros in editable inputs. `Öğüne ekle` invokes `addMealAction` with the selected date/meal type and no `food_cache_id`, then uses the form's existing success/reset behavior.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --test tests/ai-prompt-meal.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/forms/AddMealForm.tsx tests/ai-prompt-meal.test.mjs
git commit -m "feat: add AI prompt meal form"
```

### Task 3: Regression verification

**Files:**
- Modify: `package.json`
- Test: `tests/ai-prompt-meal.test.mjs`

**Interfaces:**
- Produces: `npm run test:prompt-meal` and inclusion in the project test script.

- [ ] **Step 1: Add the focused script**

```json
"test:prompt-meal": "node --experimental-strip-types --test tests/ai-prompt-meal.test.mjs"
```

- [ ] **Step 2: Run focused test, type check, and production build**

Run: `npm run test:prompt-meal && npx tsc --noEmit && npm run build`

Expected: exit code 0 and `/api/food/prompt-meal` compiled in the build output.

- [ ] **Step 3: Check the patch**

Run: `git diff --check`

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add package.json tests/ai-prompt-meal.test.mjs
git commit -m "test: cover AI prompt meal flow"
```
