# Manual Food Storage and Label Upload Design

## Goal

Let users decide whether a manually entered food is saved to their personal food database, and make nutrition-label OCR available from both the camera and photo library.

## Root Cause

The visible label-scan action in the Manual Entry tab targets a file-input ref that is only mounted in a different search sub-flow. In Manual Entry that ref is null, so tapping the action cannot open a picker.

## Design

Two persistent hidden file inputs will be mounted with the meal form. The camera input uses the rear-camera capture hint; the gallery input has no capture hint, allowing the native file library. Both call the same existing OCR request and populate the manual fields.

Manual Entry adds an unchecked “save to my food database” control. When enabled, the entered total nutrition is normalized to the selected quantity and sent to the existing authenticated manual-food route before the meal is added. When disabled, the meal is added only to DailyLog. The resulting FoodCache id is attached to the daily meal only when a database record was created.

## Validation

- A storage payload requires a non-empty food name, positive quantity, and non-negative nutrients.
- Manual units shown in the form, including portion, slice, and handful, are valid FoodCache units.
- Camera accepts only supported images and gallery remains available without a capture attribute.

## Testing

Unit tests cover per-100g normalization, per-unit normalization, and distinct camera/gallery input attributes. Existing build validation covers the client form and API imports.
