export function calculateTargetCalories(
  weight: number,
  height: number,
  age: number,
  gender: string,
  activityLevel: string,
  goal: string
): number {
  if (!weight || !height || !age) return 0;
  if (isNaN(weight) || isNaN(height) || isNaN(age)) return 0;

  // Mifflin-St Jeor Equation
  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  bmr += gender === 'Male' ? 5 : -161;

  // Activity Multiplier
  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };
  
  // Default to sedentary if unknown
  const multiplier = multipliers[activityLevel] || 1.2;
  let tdee = bmr * multiplier;

  // Goal adjustment
  if (goal === 'lose') tdee -= 500;
  if (goal === 'gain') tdee += 500;

  return Math.max(1200, Math.round(tdee)); // Min 1200 kalori
}
