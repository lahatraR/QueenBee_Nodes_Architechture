export function createMemoryMeasuresRepository(initial = []) {
  const measures = [...initial];

  return {
    // De la plus récente à la plus ancienne, puis la page demandée.
    async findByHive(hiveId, { limit, offset }) {
      return measures
        .filter((m) => m.hive_id === hiveId)
        .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
        .slice(offset, offset + limit);
    },

    async add(measure) {
      measures.push(measure);
      return measure;
    },
  };
}
