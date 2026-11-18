// PENDING and JUDGING are "in progress"; everything else is a final result
export function isFinal(verdict) {
  return verdict !== "PENDING" && verdict !== "JUDGING";
}