import { MAP_TYPES } from '@deck.gl/carto';

const BOUNDARIES_SOURCE_ID = 'boundariesSource';

const source = {
  id: BOUNDARIES_SOURCE_ID,
  type: MAP_TYPES.TABLE,
  connection: 'bigquery',
  data: `cartodb-on-gcp-pm-team.borja.gic_boundaries`,
};

export default source;
