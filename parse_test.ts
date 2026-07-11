const descriptions = [
  "Per 1 serving - Calories: 130kcal | Fat: 1.50g | Carbs: 26.00g | Protein: 2.00g",
  "Per 100g - Calories: 348kcal | Fat: 2.40g | Carbs: 74.10g | Protein: 20.00g",
  "Per 1 oz - Calories: 110kcal | Fat: 9.00g | Carbs: 0.00g | Protein: 7.00g",
  "Per 1 cup - Calories: 210kcal | Fat: 1.50g | Carbs: 44.00g | Protein: 6.00g",
  "Per 1 tbsp - Calories: 120kcal | Fat: 14.00g | Carbs: 0.00g | Protein: 0.00g"
];

for (const desc of descriptions) {
  const match = desc.match(/Per ([\d.]+) (\w+)\s*- Calories: (\d+)kcal \| Fat: ([\d.]+)g \| Carbs: ([\d.]+)g \| Protein: ([\d.]+)g/);
  if (match) {
    const [, amount, unit, cals, fat, carbs, protein] = match;
    console.log(`Amount: ${amount}, Unit: ${unit}, Cals: ${cals}, Fat: ${fat}, Carbs: ${carbs}, Protein: ${protein}`);
  } else {
    console.log("No match for:", desc);
  }
}
