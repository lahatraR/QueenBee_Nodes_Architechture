import { NotFoundError } from "../errors.js";

export function createHivesService({ hivesRepository }) {
  return {
    async list({ site_id } = {}) {
      // Un ?site_id= vide n'est pas un filtre.
      return hivesRepository.findAll({ site_id: site_id || undefined });
    },

    async getById(id) {
      const hive = await hivesRepository.findById(id);
      if (!hive) {
        throw new NotFoundError(`Aucune ruche ne porte l'identifiant ${id}.`);
      }
      return hive;
    },
  };
}
