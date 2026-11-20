// import { NotFoundError } from "../errors.js";

// export function createHivesService({ hivesRepository }) {
//   return {
//     async list({ site_id } = {}) {
//       // Un ?site_id= vide n'est pas un filtre.
//       return hivesRepository.findAll({ site_id: site_id || undefined });
//     },

//     async getById(id) {
//       const hive = await hivesRepository.findById(id);
//       if (!hive) {
//         throw new NotFoundError(`Aucune ruche ne porte l'identifiant ${id}.`);
//       }
//       return hive;
//     },
//   };
// }

import { NotFoundError, ForbiddenError } from "../errors.js";

// La règle d'accès, écrite une seule fois. Tous les services passent par getById.
export function canAccessHive(user, hive) {
  switch (user.role) {
    case "admin":
    case "gestionnaire":
      return true;
    case "coordinateur":
      return hive.site_id === user.site_id;
    case "apiculteur":
      return hive.owner_id === user.id;
    default:
      return false;
  }
}

export function createHivesService({ hivesRepository }) {
  return {
    async list(user, { site_id } = {}) {
      if (user.role === "coordinateur") {
        if (site_id && site_id !== user.site_id) {
          throw new ForbiddenError(`Vous n'avez pas accès au site ${site_id}.`);
        }
        return hivesRepository.findAll({ site_id: user.site_id });
      }
      if (user.role === "apiculteur") {
        return hivesRepository.findAll({ site_id, owner_id: user.id });
      }
      return hivesRepository.findAll({ site_id }); // admin, gestionnaire
    },

    // L'existence d'abord (404), les droits ensuite (403).
    async getById(user, id) {
      const hive = await hivesRepository.findById(id);
      if (!hive) {
        throw new NotFoundError(`Aucune ruche ne porte l'identifiant ${id}.`);
      }
      if (!canAccessHive(user, hive)) {
        throw new ForbiddenError(`Vous n'avez pas accès à la ruche ${id}.`);
      }
      return hive;
    },
  };
}
