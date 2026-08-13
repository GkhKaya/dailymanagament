export function isMale(gender?: string | null): boolean {
  if (!gender) return true;
  const g = String(gender).trim().toLowerCase();
  return g === 'male' || g === 'erkek' || g === 'm';
}

export function calculateAge(birthDate?: Date | string | null): number {
  if (!birthDate) return 25;
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return 25;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(1, age);
}

export function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender?: string | null
): number {
  if (!weight || !height || !age || isNaN(weight) || isNaN(height) || isNaN(age)) return 0;
  const male = isMale(gender);
  const bmr = (10 * weight) + (6.25 * height) - (5 * age) + (male ? 5 : -161);
  return Math.round(bmr);
}

export function calculateStepsCalories(weight: number, steps: number): number {
  if (!Number.isFinite(weight) || !Number.isFinite(steps) || weight <= 0 || steps <= 0) return 0;
  return Math.round(weight * steps * 0.0005);
}

export function calculateTargetCalories(
  weight: number,
  height: number,
  age: number,
  gender: string,
  activityLevel: string,
  goal: string
): number {
  const bmr = calculateBMR(weight, height, age, gender);
  if (!bmr) return 0;

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
