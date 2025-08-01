
export const validatePassengerCounts = (
  adults: number,
  children: number,
  infants: number
) => adults >= 1 && adults + children + infants <= 9 && adults >= infants;

export function validateDOB(
  date_of_birth: string,
  passenger_type: "adult" | "child" | "infant"
) {
  const dob = new Date(date_of_birth).getTime();
  if (isNaN(dob)) return false;
  const today = new Date().getTime();
  const age = Math.floor((today - dob) / (365 * 24 * 3600 * 1000));
  if (passenger_type === "adult") return age >= 12;
  if (passenger_type === "child") return age < 12 && age >= 2;
  if (passenger_type === "infant") return age >= 0 && age < 2;
  return false;
}
