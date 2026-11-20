// import { ValidationError } from "../errors.js";

// // Plages physiques retenues pour le module (UC-CY02, champs du § 6.5).
// export const PLAGES = {
//   position_lat: [-90, 90],
//   position_lon: [-180, 180],
//   weight_kg: [0, 150],
//   temp_internal_c: [-10, 60],
//   temp_external_c: [-20, 60],
//   humidity_pct: [0, 100],
//   acoustic_activity_score: [0, 1],
//   battery_pct: [0, 100],
// };

// export function createMeasuresService({ hivesService, measuresRepository }) {
//   return {
//     async list(hiveId, { limit = 50, offset = 0 } = {}) {
//       await hivesService.getById(hiveId); // 404 avant la validation des paramètres

//       if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
//         throw new ValidationError("Le paramètre limit doit être un entier compris entre 1 et 500.");
//       }
//       if (!Number.isInteger(offset) || offset < 0) {
//         throw new ValidationError("Le paramètre offset doit être un entier positif ou nul.");
//       }

//       const items = await measuresRepository.findByHive(hiveId, { limit, offset });
//       return { items, limit, offset };
//     },

//     async add(hiveId, data = {}) {
//       const hive = await hivesService.getById(hiveId);

//       if (data.timestamp === undefined) {
//         throw new ValidationError("Le champ timestamp est obligatoire.");
//       }
//       if (data.weight_kg === undefined) {
//         throw new ValidationError("Le champ weight_kg est obligatoire.");
//       }
//       if (data.hive_id !== undefined && data.hive_id !== hive.id) {
//         throw new ValidationError("Le hive_id du corps ne correspond pas à celui du chemin.");
//       }

//       // Chaque champ présent doit être un nombre dans sa plage physique.
//       for (const [champ, [min, max]] of Object.entries(PLAGES)) {
//         const valeur = data[champ];
//         if (valeur === undefined) continue;
//         if (typeof valeur !== "number" || !Number.isFinite(valeur) || valeur < min || valeur > max) {
//           throw new ValidationError(`Le champ ${champ} doit être un nombre compris entre ${min} et ${max}.`);
//         }
//       }

//       // On garde le timestamp de la trame ; hive_id et site_id viennent de la ruche.
//       return measuresRepository.add({ ...data, hive_id: hive.id, site_id: hive.site_id });
//     },
//   };
// }

// import { ValidationError } from "../errors.js";

// // La forme de la mesure (obligatoires, types, plages) est vérifiée par measureSchema.
// // Le service garde les règles qui ont besoin de la ruche.
// export function createMeasuresService({ hivesService, measuresRepository }) {
//   return {
//     async list(hiveId, { limit = 50, offset = 0 } = {}) {
//       await hivesService.getById(hiveId); // 404 si la ruche n'existe pas
//       const items = await measuresRepository.findByHive(hiveId, { limit, offset });
//       return { items, limit, offset };
//     },

//     async add(hiveId, data) {
//       const hive = await hivesService.getById(hiveId);

//       if (data.hive_id !== undefined && data.hive_id !== hive.id) {
//         throw new ValidationError(
//           `Le hive_id du corps (${data.hive_id}) ne correspond pas à la ruche ${hive.id}.`
//         );
//       }

//       // On garde le timestamp de la trame ; hive_id et site_id viennent de la ruche.
//       return measuresRepository.add({ ...data, hive_id: hive.id, site_id: hive.site_id });
//     },
//   };
// }

import { ValidationError } from "../errors.js";

export function createMeasuresService({ hivesService, measuresRepository }) {
  return {
    async list(user, hiveId, { limit = 50, offset = 0 } = {}) {
      await hivesService.getById(user, hiveId); // 404, puis 403
      const items = await measuresRepository.findByHive(hiveId, { limit, offset });
      return { items, limit, offset };
    },

    async add(user, hiveId, data) {
      const hive = await hivesService.getById(user, hiveId);
      if (data.hive_id !== undefined && data.hive_id !== hive.id) {
        throw new ValidationError(
          `Le hive_id du corps (${data.hive_id}) ne correspond pas à la ruche ${hive.id}.`
        );
      }
      return measuresRepository.add({ ...data, hive_id: hive.id, site_id: hive.site_id });
    },
  };
}
