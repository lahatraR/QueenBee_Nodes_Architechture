// // Les alias rendent le format de l'API : measured_at → timestamp, lat/lon → position_lat/lon.
// export function createMeasuresRepository(pool) {
//   return {
//     async findByHive(hiveId, { limit, offset }) {
//       const { rows } = await pool.query(
//         `SELECT m.hive_id, h.site_id, m.measured_at AS timestamp,
//                 m.lat AS position_lat, m.lon AS position_lon,
//                 m.weight_kg, m.temp_internal_c, m.temp_external_c, m.humidity_pct,
//                 m.acoustic_activity_score, m.battery_pct
//            FROM measures m
//            JOIN hives h ON h.id = m.hive_id
//           WHERE m.hive_id = $1
//           ORDER BY m.measured_at DESC
//           LIMIT $2 OFFSET $3`,
//         [hiveId, limit, offset],
//       );
//       return rows;
//     },

//     async add(measure) {
//       const { rows } = await pool.query(
//         `INSERT INTO measures (hive_id, measured_at, weight_kg, temp_internal_c, temp_external_c,
//                                humidity_pct, acoustic_activity_score, battery_pct, lat, lon)
//          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
//          RETURNING hive_id, measured_at AS timestamp,
//                    lat AS position_lat, lon AS position_lon,
//                    weight_kg, temp_internal_c, temp_external_c, humidity_pct,
//                    acoustic_activity_score, battery_pct`,
//         [
//           measure.hive_id,
//           measure.timestamp, // colonne measured_at
//           measure.weight_kg,
//           measure.temp_internal_c ?? null,
//           measure.temp_external_c ?? null,
//           measure.humidity_pct ?? null,
//           measure.acoustic_activity_score ?? null,
//           measure.battery_pct ?? null,
//           measure.position_lat ?? null, // colonne lat
//           measure.position_lon ?? null, // colonne lon
//         ],
//       );
//       // site_id n'est pas une colonne de measures : on le reprend de la mesure reçue.
//       return { ...rows[0], site_id: measure.site_id };
//     },
//   };
// }

// Les alias rendent le format de l'API : measured_at → timestamp, lat/lon → position_lat/lon.
const SELECT_MEASURE = `
  SELECT m.hive_id, h.site_id, m.measured_at AS timestamp,
         m.lat AS position_lat, m.lon AS position_lon,
         m.weight_kg, m.temp_internal_c, m.temp_external_c, m.humidity_pct,
         m.acoustic_activity_score, m.battery_pct
    FROM measures m
    JOIN hives h ON h.id = m.hive_id`;

export function createMeasuresRepository(pool) {
  // Relit une mesure au format de l'API : la même requête que findByHive, filtrée sur l'instant.
  async function findOne(hiveId, timestamp) {
    const { rows } = await pool.query(
      `${SELECT_MEASURE} WHERE m.hive_id = $1 AND m.measured_at = $2`,
      [hiveId, timestamp],
    );
    return rows[0] ?? null;
  }

  return {
    async findByHive(hiveId, { limit, offset }) {
      const { rows } = await pool.query(
        `${SELECT_MEASURE}
          WHERE m.hive_id = $1
          ORDER BY m.measured_at DESC
          LIMIT $2 OFFSET $3`,
        [hiveId, limit, offset],
      );
      return rows;
    },

    // ON CONFLICT DO NOTHING : une mesure déjà reçue est ignorée au lieu de lever une erreur.
    async add(measure) {
      const { rowCount } = await pool.query(
        `INSERT INTO measures (hive_id, measured_at, weight_kg, temp_internal_c, temp_external_c,
                               humidity_pct, acoustic_activity_score, battery_pct, lat, lon)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (hive_id, measured_at) DO NOTHING`,
        [
          measure.hive_id,
          measure.timestamp, // colonne measured_at
          measure.weight_kg,
          measure.temp_internal_c ?? null,
          measure.temp_external_c ?? null,
          measure.humidity_pct ?? null,
          measure.acoustic_activity_score ?? null,
          measure.battery_pct ?? null,
          measure.position_lat ?? null, // colonne lat
          measure.position_lon ?? null, // colonne lon
        ],
      );
      // rowCount vaut 1 si la ligne a été insérée, 0 si elle existait déjà.
      return { measure: await findOne(measure.hive_id, measure.timestamp), created: rowCount === 1 };
    },
  };
}
