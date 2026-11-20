// // import { ValidationError, ConflictError } from "../errors.js";

// // const STATUTS_COLONIE = ["forte", "normale", "faible", "morte"];
// // const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// // const DATE_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

// // export function createInspectionsService({ hivesService, inspectionsRepository }) {
// //   return {
// //     async list(hiveId) {
// //       await hivesService.getById(hiveId);
// //       return inspectionsRepository.findByHive(hiveId);
// //     },

// //     async add(hiveId, data = {}) {
// //       const hive = await hivesService.getById(hiveId);
// //       const { id, inspected_at, colony_status, queen_present, observations } = data;

// //       if (typeof id !== "string" || !UUID.test(id)) {
// //         throw new ValidationError("Le champ id est obligatoire et doit être un UUID.");
// //       }
// //       if (typeof inspected_at !== "string" || !DATE_ISO.test(inspected_at) || Number.isNaN(Date.parse(inspected_at))) {
// //         throw new ValidationError(
// //           "Le champ inspected_at est obligatoire et doit être une date ISO 8601 (ex. 2026-10-31T09:30:00Z)."
// //         );
// //       }
// //       if (!STATUTS_COLONIE.includes(colony_status)) {
// //         throw new ValidationError("Le champ colony_status doit valoir forte, normale, faible ou morte.");
// //       }
// //       if (queen_present !== undefined && typeof queen_present !== "boolean") {
// //         throw new ValidationError("Le champ queen_present doit être un booléen.");
// //       }
// //       if (observations !== undefined && typeof observations !== "string") {
// //         throw new ValidationError("Le champ observations doit être un texte.");
// //       }
// //       // L'UUID est choisi par l'application mobile : deux envois du même id sont un conflit.
// //       if (await inspectionsRepository.findById(id)) {
// //         throw new ConflictError(`Une inspection porte déjà l'identifiant ${id}.`);
// //       }

// //       return inspectionsRepository.add({
// //         id,
// //         hive_id: hive.id,
// //         inspected_at,
// //         colony_status,
// //         queen_present: queen_present ?? null,
// //         observations: observations ?? null,
// //       });
// //     },
// //   };
// // }

// // import { ValidationError, ConflictError } from "../errors.js";

// // // La forme de l'inspection (UUID, date, état de colonie…) est vérifiée par inspectionSchema.
// // export function createInspectionsService({ hivesService, inspectionsRepository }) {
// //   return {
// //     async list(hiveId) {
// //       await hivesService.getById(hiveId);
// //       return inspectionsRepository.findByHive(hiveId);
// //     },

// //     async add(hiveId, data) {
// //       const hive = await hivesService.getById(hiveId);

// //       if (data.hive_id !== undefined && data.hive_id !== hive.id) {
// //         throw new ValidationError(
// //           `Le hive_id du corps (${data.hive_id}) ne correspond pas à la ruche ${hive.id}.`
// //         );
// //       }
// //       // L'UUID est choisi par l'application mobile : deux envois du même id sont un conflit
// //       // (le TP 8 rendra ce rejeu idempotent).
// //       if (await inspectionsRepository.findById(data.id)) {
// //         throw new ConflictError(`Une inspection porte déjà l'identifiant ${data.id}.`);
// //       }

// //       return inspectionsRepository.add({
// //         id: data.id,
// //         hive_id: hive.id,
// //         inspected_at: data.inspected_at,
// //         colony_status: data.colony_status,
// //         queen_present: data.queen_present ?? null,
// //         observations: data.observations ?? null,
// //       });
// //     },
// //   };
// // }

// import { ValidationError, ConflictError } from "../errors.js";

// export function createInspectionsService({ hivesService, inspectionsRepository }) {
//   return {
//     async list(user, hiveId) {
//       await hivesService.getById(user, hiveId);
//       return inspectionsRepository.findByHive(hiveId);
//     },

//     async add(user, hiveId, data) {
//       const hive = await hivesService.getById(user, hiveId);
//       if (data.hive_id !== undefined && data.hive_id !== hive.id) {
//         throw new ValidationError(
//           `Le hive_id du corps (${data.hive_id}) ne correspond pas à la ruche ${hive.id}.`
//         );
//       }
//       if (await inspectionsRepository.findById(data.id)) {
//         throw new ConflictError(`Une inspection porte déjà l'identifiant ${data.id}.`);
//       }
//       return inspectionsRepository.add({
//         id: data.id,
//         hive_id: hive.id,
//         author_id: user.id, // l'auteur vient du jeton, jamais du corps
//         inspected_at: data.inspected_at,
//         colony_status: data.colony_status,
//         queen_present: data.queen_present ?? null,
//         observations: data.observations ?? null,
//       });
//     },
//   };
// }

import { AppError, ConflictError, ValidationError } from "../errors.js";

export function createInspectionsService({ hivesService, inspectionsRepository }) {
  // L'inspection à enregistrer : l'auteur vient du jeton, jamais du corps.
  function toInspection(user, hive, data) {
    return {
      id: data.id,
      hive_id: hive.id,
      author_id: user.id,
      inspected_at: data.inspected_at,
      colony_status: data.colony_status,
      queen_present: data.queen_present ?? null,
      observations: data.observations ?? null,
    };
  }

  // Traite UNE inspection du lot, sans jamais lever d'erreur métier.
  async function syncOne(user, item) {
    try {
      const hive = await hivesService.getById(user, item.hive_id); // 404 / 403 → rejected
      const inspection = toInspection(user, hive, item);

      if (item.version === undefined) {
        // Nouvelle inspection, saisie hors connexion.
        const { inspection: stored, created } = await inspectionsRepository.insertIfAbsent(inspection);
        if (created) {
          return { id: item.id, status: "created", version: stored.version };
        }
        if (stored.hive_id !== hive.id) {
          return {
            id: item.id,
            status: "rejected",
            detail: "Cet identifiant est déjà utilisé par une inspection d'une autre ruche.",
          };
        }
        return { id: item.id, status: "unchanged", version: stored.version };
      }

      // Une version : modification. Règle retenue : le serveur l'emporte.
      const updated = await inspectionsRepository.updateIfVersion(inspection, item.version);
      if (updated) {
        return { id: item.id, status: "updated", version: updated.version };
      }

      const current = await inspectionsRepository.findById(item.id);
      if (!current || current.hive_id !== hive.id) {
        return {
          id: item.id,
          status: "rejected",
          detail: "Inspection inconnue pour cette ruche : envoyez-la sans version pour la créer.",
        };
      }
      return {
        id: item.id,
        status: "conflict",
        detail: `L'inspection a été modifiée entre-temps : version ${current.version} sur le serveur, ${item.version} sur l'appareil.`,
        current,
      };
    } catch (err) {
      if (err instanceof AppError) {
        return { id: item.id, status: "rejected", detail: err.message };
      }
      throw err; // toute autre erreur est un bug
    }
  }

  return {
    async list(user, hiveId) {
      await hivesService.getById(user, hiveId);
      return inspectionsRepository.findByHive(hiveId);
    },

    // Renvoie { inspection, created } : le contrôleur répond 201 ou 200.
    async add(user, hiveId, data) {
      const hive = await hivesService.getById(user, hiveId);
      if (data.hive_id !== undefined && data.hive_id !== hive.id) {
        throw new ValidationError(
          `Le hive_id du corps (${data.hive_id}) ne correspond pas à la ruche ${hive.id}.`
        );
      }
      const result = await inspectionsRepository.insertIfAbsent(toInspection(user, hive, data));
      if (!result.created && result.inspection.hive_id !== hive.id) {
        throw new ConflictError(
          `L'identifiant ${data.id} est déjà utilisé par une inspection d'une autre ruche.`
        );
      }
      return result;
    },

    // Les inspections sont traitées une par une : un refus n'empêche pas les autres.
    async sync(user, items) {
      const results = [];
      for (const item of items) {
        results.push(await syncOne(user, item));
      }
      const summary = { created: 0, unchanged: 0, updated: 0, conflict: 0, rejected: 0 };
      for (const result of results) {
        summary[result.status] += 1;
      }
      return { summary, results };
    },
  };
}
