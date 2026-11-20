const COLUMNS = `id, hive_id, author_id, inspected_at, colony_status, queen_present, observations`;

export function createInspectionsRepository(pool) {
  return {
    async findByHive(hiveId) {
      const { rows } = await pool.query(
        `SELECT ${COLUMNS} FROM inspections WHERE hive_id = $1 ORDER BY inspected_at DESC`,
        [hiveId],
      );
      return rows;
    },

    async findById(id) {
      const { rows } = await pool.query(`SELECT ${COLUMNS} FROM inspections WHERE id = $1`, [id]);
      return rows[0] ?? null;
    },

    // author_id est obligatoire, mais l'authentification n'arrive qu'au TP 7 :
    // en attendant, l'auteur est le propriétaire de la ruche.
    async add(inspection) {
      const { rows } = await pool.query(
        `INSERT INTO inspections (id, hive_id, author_id, inspected_at, queen_present,
                                  colony_status, observations)
         VALUES ($1, $2, (SELECT owner_id FROM hives WHERE id = $2), $3, $4, $5, $6)
         RETURNING ${COLUMNS}`,
        [
          inspection.id,
          inspection.hive_id,
          inspection.inspected_at,
          inspection.queen_present,
          inspection.colony_status,
          inspection.observations,
        ],
      );
      return rows[0];
    },
  };
}
