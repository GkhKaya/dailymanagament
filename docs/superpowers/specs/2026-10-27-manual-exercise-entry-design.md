# Manual Exercise Entry Design

## Goal

Allow a user to record a custom exercise with its own name, duration, and burned-calorie value from the existing exercise sheet.

## Design

The existing exercise type selector gains a `Manuel` option. Selecting it reveals a required exercise-name input while retaining the existing duration and burned-calorie fields. Manual calorie input is preserved instead of being overwritten by the activity estimator.

The form converts its state into a small validated submission payload before calling the existing authenticated `addExerciseAction`. No database or server action shape changes are needed because the action already accepts a name, duration, and calories and stores non-step exercises as manual.

## Validation

- Manual exercise name is trimmed and required.
- Duration must be greater than zero for manual exercises.
- Calories must be zero or greater.
- Existing exercise types and step-count behavior remain unchanged.

## Testing

The submission builder is covered with a unit test for a manual exercise payload and missing manual name. The existing production build validates the form integration.
