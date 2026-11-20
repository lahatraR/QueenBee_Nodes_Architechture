// // import { test } from "node:test";
// // import assert from "node:assert/strict";
// // import { createMeasuresService } from "../src/services/measures.service.js";
// // import { ValidationError } from "../src/errors.js";

// // // Prépare un service avec de faux collaborateurs : pas de serveur, pas de vraie donnée.
// // function preparer() {
// //   const enregistrees = [];
// //   const measuresRepository = {
// //     async add(mesure) {
// //       enregistrees.push(mesure);
// //       return mesure;
// //     },
// //     async findByHive() {
// //       return [];
// //     },
// //   };
// //   const hivesService = {
// //     async getById(id) {
// //       return { id, site_id: "SN-CASA", status: "active" };
// //     },
// //   };
// //   const service = createMeasuresService({ hivesService, measuresRepository });
// //   return { service, enregistrees };
// // }

// // test("refuse un poids hors de sa plage physique", async () => {
// //   // Préparer : un faux repository qui garde ce qu'on lui donne, injecté dans le service
// //   const { service, enregistrees } = preparer();

// //   // Agir : ajouter une mesure de 500 kg
// //   const ajout = service.add("SN-CASA-001", { timestamp: "2026-10-31T10:00:00Z", weight_kg: 500 });

// //   // Vérifier : une ValidationError est levée, et rien n'est enregistré
// //   await assert.rejects(ajout, ValidationError);
// //   assert.equal(enregistrees.length, 0);
// // });

// // test("enregistre une mesure dont le poids est dans sa plage", async () => {
// //   const { service, enregistrees } = preparer();

// //   await service.add("SN-CASA-001", { timestamp: "2026-10-31T10:00:00Z", weight_kg: 36.84 });

// //   assert.equal(enregistrees.length, 1);
// //   assert.equal(enregistrees[0].hive_id, "SN-CASA-001");
// // });

// import { test } from "node:test";
// import assert from "node:assert/strict";
// import { createMeasuresService } from "../src/services/measures.service.js";
// import { NotFoundError, ValidationError } from "../src/errors.js";

// const hive = { id: "SN-CASA-001", site_id: "SN-CASA", status: "active" };
// const admin = { id: "u-admin", role: "admin", site_id: null };

// // Un faux service des ruches : seule SN-CASA-001 existe.
// const fakeHivesService = {
//   async getById(user, id) {
//     if (id !== hive.id) throw new NotFoundError(`Aucune ruche ne porte l'identifiant ${id}.`);
//     return hive;
//   },
// };

// // Un faux repository qui garde ce qu'on lui donne.
// function createFakeMeasuresRepository() {
//   const added = [];
//   return {
//     added,
//     async add(measure) {
//       added.push(measure);
//       return measure;
//     },
//     async findByHive() {
//       return [];
//     },
//   };
// }

// const validMeasure = { timestamp: "2026-10-31T10:00:00Z", weight_kg: 36.84 };

// test("enregistre une mesure valide, avec la ruche et le site du chemin", async () => {
//   const measuresRepository = createFakeMeasuresRepository();
//   const service = createMeasuresService({ hivesService: fakeHivesService, measuresRepository });

//   const measure = await service.add(admin, "SN-CASA-001", validMeasure)

//   assert.equal(measure.hive_id, "SN-CASA-001");
//   assert.equal(measure.site_id, "SN-CASA");
//   assert.equal(measuresRepository.added.length, 1);
// });

// test("refuse une trame qui désigne une autre ruche que le chemin", async () => {
//   const measuresRepository = createFakeMeasuresRepository();
//   const service = createMeasuresService({ hivesService: fakeHivesService, measuresRepository });

//   await assert.rejects(
//     service.add(admin, "SN-CASA-001", { ...validMeasure, hive_id: "SN-CASA-002" }),
//     ValidationError,
//   );
//   assert.equal(measuresRepository.added.length, 0); // rien n'a été enregistré
// });

// test("refuse une mesure sur une ruche inconnue", async () => {
//   const measuresRepository = createFakeMeasuresRepository();
//   const service = createMeasuresService({ hivesService: fakeHivesService, measuresRepository });

//   await assert.rejects(service.add(admin, "XX-NOPE-999", validMeasure), NotFoundError);
//   assert.equal(measuresRepository.added.length, 0);
// });
import { test } from "node:test";
import assert from "node:assert/strict";
import { createMeasuresService } from "../src/services/measures.service.js";
import { NotFoundError, ValidationError } from "../src/errors.js";

const hive = { id: "SN-CASA-001", site_id: "SN-CASA", status: "active" };
const admin = { id: "u-admin", role: "admin", site_id: null };

// Un faux service des ruches : seule SN-CASA-001 existe.
const fakeHivesService = {
  async getById(user, id) {
    if (id !== hive.id) throw new NotFoundError(`Aucune ruche ne porte l'identifiant ${id}.`);
    return hive;
  },
};

// Imite ON CONFLICT (hive_id, measured_at) DO NOTHING.
function createFakeMeasuresRepository() {
  const added = [];
  return {
    added,
    async add(measure) {
      const existing = added.find((m) => m.hive_id === measure.hive_id && m.timestamp === measure.timestamp);
      if (existing) {
        return { measure: existing, created: false };
      }
      added.push(measure);
      return { measure, created: true };
    },
    async findByHive() {
      return [];
    },
  };
}

const validMeasure = { timestamp: "2026-10-31T10:00:00Z", weight_kg: 36.84 };

test("enregistre une mesure valide, avec la ruche et le site du chemin", async () => {
  const measuresRepository = createFakeMeasuresRepository();
  const service = createMeasuresService({ hivesService: fakeHivesService, measuresRepository });

  const { measure, created } = await service.add(admin, "SN-CASA-001", validMeasure);

  assert.equal(created, true);
  assert.equal(measure.hive_id, "SN-CASA-001");
  assert.equal(measure.site_id, "SN-CASA");
  assert.equal(measuresRepository.added.length, 1);
});

test("une trame reçue deux fois n'est enregistrée qu'une fois", async () => {
  const measuresRepository = createFakeMeasuresRepository();
  const service = createMeasuresService({ hivesService: fakeHivesService, measuresRepository });

  await service.add(admin, "SN-CASA-001", validMeasure);
  const second = await service.add(admin, "SN-CASA-001", validMeasure);

  assert.equal(second.created, false);
  assert.equal(measuresRepository.added.length, 1);
});

test("refuse une trame qui désigne une autre ruche que le chemin", async () => {
  const measuresRepository = createFakeMeasuresRepository();
  const service = createMeasuresService({ hivesService: fakeHivesService, measuresRepository });

  await assert.rejects(
    service.add(admin, "SN-CASA-001", { ...validMeasure, hive_id: "SN-CASA-002" }),
    ValidationError,
  );
  assert.equal(measuresRepository.added.length, 0);
});

test("refuse une mesure sur une ruche inconnue", async () => {
  const measuresRepository = createFakeMeasuresRepository();
  const service = createMeasuresService({ hivesService: fakeHivesService, measuresRepository });

  await assert.rejects(service.add(admin, "XX-NOPE-999", validMeasure), NotFoundError);
  assert.equal(measuresRepository.added.length, 0);
});
