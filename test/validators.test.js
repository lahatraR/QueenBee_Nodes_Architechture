import { test } from "node:test";
import assert from "node:assert/strict";
import { validate } from "../src/middlewares/validate.js";
import { measureSchema, paginationSchema, inspectionSchema } from "../src/validators/schemas.js";
import { ValidationError } from "../src/errors.js";

// Fait passer des données dans validate, sans serveur, et renvoie req.validated.
function run(schema, data, source = "body") {
  const req = { [source]: data };
  validate(schema, source)(req, {}, () => {});
  return req.validated;
}

test("refuse un poids hors de sa plage physique", () => {
  assert.throws(
    () => run(measureSchema, { timestamp: "2026-10-31T00:00:00Z", weight_kg: 500 }),
    ValidationError,
  );
});

test("refuse un poids qui n'est pas un nombre", () => {
  assert.throws(
    () => run(measureSchema, { timestamp: "2026-10-31T00:00:00Z", weight_kg: "abc" }),
    ValidationError,
  );
});

test("signale toutes les erreurs d'un coup", () => {
  assert.throws(
    () => run(measureSchema, { timestamp: "2026-10-31T00:00:00Z", weight_kg: 500, humidity_pct: 120 }),
    { message: "weight_kg doit être inférieur ou égal à 150. humidity_pct doit être inférieur ou égal à 100." },
  );
});

test("accepte une mesure valide", () => {
  const value = run(measureSchema, { timestamp: "2026-10-31T00:00:00Z", weight_kg: 36.84 });
  assert.equal(value.weight_kg, 36.84);
});

test("pagination : convertit les chaînes et applique les défauts", () => {
  assert.deepEqual(run(paginationSchema, { limit: "10" }, "query"), { limit: 10, offset: 0 });
  assert.deepEqual(run(paginationSchema, {}, "query"), { limit: 50, offset: 0 });
  assert.throws(() => run(paginationSchema, { limit: "abc" }, "query"), ValidationError);
});

test("refuse un champ non déclaré dans une inspection", () => {
  assert.throws(
    () => run(inspectionSchema, {
      id: "0b6c4a0e-6f1f-4d8e-9a39-2f3c9b1d7e55",
      inspected_at: "2026-11-01T09:00:00Z",
      colony_status: "forte",
      author_id: "x",
    }),
    { message: "author_id n'est pas un champ autorisé." },
  );
});
