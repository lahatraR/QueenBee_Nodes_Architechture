import { test } from "node:test";
import assert from "node:assert/strict";
import { createMeasuresService } from "../src/services/measures.service.js";
import { ValidationError } from "../src/errors.js";

// Prépare un service avec de faux collaborateurs : pas de serveur, pas de vraie donnée.
function preparer() {
  const enregistrees = [];
  const measuresRepository = {
    async add(mesure) {
      enregistrees.push(mesure);
      return mesure;
    },
    async findByHive() {
      return [];
    },
  };
  const hivesService = {
    async getById(id) {
      return { id, site_id: "SN-CASA", status: "active" };
    },
  };
  const service = createMeasuresService({ hivesService, measuresRepository });
  return { service, enregistrees };
}

test("refuse un poids hors de sa plage physique", async () => {
  // Préparer : un faux repository qui garde ce qu'on lui donne, injecté dans le service
  const { service, enregistrees } = preparer();

  // Agir : ajouter une mesure de 500 kg
  const ajout = service.add("SN-CASA-001", { timestamp: "2026-10-31T10:00:00Z", weight_kg: 500 });

  // Vérifier : une ValidationError est levée, et rien n'est enregistré
  await assert.rejects(ajout, ValidationError);
  assert.equal(enregistrees.length, 0);
});

test("enregistre une mesure dont le poids est dans sa plage", async () => {
  const { service, enregistrees } = preparer();

  await service.add("SN-CASA-001", { timestamp: "2026-10-31T10:00:00Z", weight_kg: 36.84 });

  assert.equal(enregistrees.length, 1);
  assert.equal(enregistrees[0].hive_id, "SN-CASA-001");
});
