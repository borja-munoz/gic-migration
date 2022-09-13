import { useEffect } from 'react';
import boundariesSource from 'data/sources/boundariesSource';
import { BOUNDARIES_CARTO_LAYER_ID } from 'components/layers/BoundariesCartoLayer';
import { useDispatch } from 'react-redux';
import { addLayer, removeLayer, addSource, removeSource } from '@carto/react-redux';

import { makeStyles } from '@material-ui/core/styles';
import { Grid } from '@material-ui/core';

const useStyles = makeStyles(() => ({
  boundariesCartoLayer: {},
}));

export default function BoundariesCartoLayer() {
  const dispatch = useDispatch();
  const classes = useStyles();

  useEffect(() => {
    dispatch(addSource(boundariesSource));

    dispatch(
      addLayer({
        id: BOUNDARIES_CARTO_LAYER_ID,
        source: boundariesSource.id,
      })
    );

    return () => {
      dispatch(removeLayer(BOUNDARIES_CARTO_LAYER_ID));
      dispatch(removeSource(boundariesSource.id));
    };
  }, [dispatch]);

  // [hygen] Add useEffect

  return (
    <Grid container direction='column' className={classes.boundariesCartoLayer}>
      <Grid item>Hello World</Grid>
    </Grid>
  );
}
