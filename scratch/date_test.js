
const dbDateStr = "2026-05-08T07:20:12.497126";
const parsed = new Date(dbDateStr).getTime();
const withZ = new Date(dbDateStr + "Z").getTime();
console.log("Without Z:", new Date(parsed).toISOString(), parsed);
console.log("With Z:", new Date(withZ).toISOString(), withZ);
