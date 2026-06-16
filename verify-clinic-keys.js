import fs from "fs";

const en = JSON.parse(
  fs.readFileSync("public/locales/en/translation.json", "utf8"),
);
const ar = JSON.parse(
  fs.readFileSync("public/locales/ar/translation.json", "utf8"),
);

const en_keys = Object.keys(en.translation || {});
const ar_keys = Object.keys(ar.translation || {});

const clinic_keys = en_keys.filter((k) => k.includes("DoctorClinicProfile"));
console.log("\n✓ ClinicProfile Keys Count:", clinic_keys.length);
clinic_keys.forEach((k) => console.log("  ✓", k));

const missing_in_ar = clinic_keys.filter((k) => !ar_keys.includes(k));
if (missing_in_ar.length > 0) {
  console.log("\n✗ Missing in AR:", missing_in_ar);
  process.exit(1);
} else {
  console.log("\n✓ All ClinicProfile keys synced in AR\n");
}
