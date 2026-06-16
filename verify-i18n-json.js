import en from "./public/locales/en/translation.json" assert { type: "json" };
import ar from "./public/locales/ar/translation.json" assert { type: "json" };

function assert(ok, msg) {
  if (!ok) throw new Error(msg);
}

assert(
  en.translation["pages_Auth.text_login"] === "Login",
  "en pages_Auth login missing",
);
assert(
  ar.translation["pages_Auth.text_login"] === "Login",
  "ar pages_Auth login missing",
);
assert(
  en.translation["secretary_appointments.title"] === "Appointments",
  "en secretary title missing",
);
assert(
  ar.translation["secretary_appointments.title"] === "المواعيد",
  "ar secretary title missing",
);
assert(
  en.translation.appointment_records.statuses.pending === "Pending",
  "en appointment status missing",
);
assert(
  ar.translation.appointment_records.statuses.pending === "قيد الانتظار",
  "ar appointment status missing",
);
assert(
  en.translation.dashboard === "Dashboard",
  "en sidebar dashboard missing",
);
assert(
  ar.translation.dashboard === "لوحة القيادة",
  "ar sidebar dashboard missing",
);
console.log("JSON keys OK");
