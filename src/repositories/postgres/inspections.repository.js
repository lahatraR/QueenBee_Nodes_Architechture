// const COLUMNS = `id, hive_id, author_id, inspected_at, colony_status, queen_present, observations`;

// export function createInspectionsRepository(pool) {
//   return {
//     async findByHive(hiveId) {
//       const { rows } = await pool.query(
//         `SELECT ${COLUMNS} FROM inspections WHERE hive_id = $1 ORDER BY inspected_at DESC`,
//         [hiveId],
//       );
//       return rows;
//     },

//     async findById(id) {
//       const { rows } = await pool.query(`SELECT ${COLUMNS} FROM inspections WHERE id = $1`, [id]);
//       return rows[0] ?? null;
//     },

//     // author_id est obligatoire, mais l'authentification n'arrive qu'au TP 7 :
//     // en attendant, l'auteur est le propriétaire de la ruche.
//     // async add(inspection) {
//     //   const { rows } = await pool.query(
//     //     `INSERT INTO inspections (id, hive_id, author_id, inspected_at, queen_present,
//     //                               colony_status, observations)
//     //      VALUES ($1, $2, (SELECT owner_id FROM hives WHERE id = $2), $3, $4, $5, $6)
//     //      RETURNING ${COLUMNS}`,
//     //     [
//     //       inspection.id,
//     //       inspection.hive_id,
//     //       inspection.inspected_at,
//     //       inspection.queen_present,
//     //       inspection.colony_status,
//     //       inspection.observations,
//     //     ],
//     //   );
//     //   return rows[0];
//     // },
//         async add(inspection) {
//       const { rows } = await pool.query(
//         `INSERT INTO inspections (id, hive_id, author_id, inspected_at, queen_present,
//                                   colony_status, observations)
//          VALUES ($1, $2, $3, $4, $5, $6, $7)
//          RETURNING ${COLUMNS}`,
//         [
//           inspection.id,
//           inspection.hive_id,
//           inspection.author_id,
//           inspection.inspected_at,
//           inspection.queen_present,
//           inspection.colony_status,
//           inspection.observations,
//         ],
//       );
//       return rows[0];
//     },

//   };
// }

// version, created_at et updated_at sont maintenant renvoyés par toutes les lectures.
const COLUMNS = `id, hive_id, author_id, inspected_at, colony_status, queen_present,
                 observations, version, created_at, updated_at`;

export function createInspectionsRepository(pool) {
  async function findById(id) {
    const { rows } = await pool.query(`SELECT ${COLUMNS} FROM inspections WHERE id = $1`, [id]);
    return rows[0] ?? null;
  }

  return {
    findById,

    async findByHive(hiveId) {
      const { rows } = await pool.query(
        `SELECT ${COLUMNS} FROM inspections WHERE hive_id = $1 ORDER BY inspected_at DESC`,
        [hiveId],
      );
      return rows;
    },

    // Une ligne renvoyée : créée. Aucune ligne : l'id existait déjà, on relit l'inspection.
    async insertIfAbsent(inspection) {
      const { rows } = await pool.query(
        `INSERT INTO inspections (id, hive_id, author_id, inspected_at, queen_present,
                                  colony_status, observations)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING
         RETURNING ${COLUMNS}`,
        [
          inspection.id,
          inspection.hive_id,
          inspection.author_id,
          inspection.inspected_at,
          inspection.queen_present,
          inspection.colony_status,
          inspection.observations,
        ],
      );
      if (rows.length === 1) {
        return { inspection: rows[0], created: true };
      }
      return { inspection: await findById(inspection.id), created: false };
    },

    // La ligne n'est modifiée que si sa version est encore celle que l'appareil connaissait.
    // Sinon, aucune ligne ne correspond, et la méthode renvoie null : c'est un conflit.
    async updateIfVersion(inspection, expectedVersion) {
      const { rows } = await pool.query(
        `UPDATE inspections
            SET inspected_at = $3, colony_status = $4, queen_present = $5, observations = $6,
                version = version + 1, updated_at = now()
          WHERE id = $1 AND hive_id = $2 AND version = $7
          RETURNING ${COLUMNS}`,
        [
          inspection.id,
          inspection.hive_id,
          inspection.inspected_at,
          inspection.colony_status,
          inspection.queen_present,
          inspection.observations,
          expectedVersion,
        ],
      );
      return rows[0] ?? null;
    },
  };
}
