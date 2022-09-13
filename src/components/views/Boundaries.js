import { useEffect } from 'react';
import boundariesSource from 'data/sources/boundariesSource';
import { BOUNDARIES_LAYER_ID } from 'components/layers/BoundariesLayer';
import { useDispatch } from 'react-redux';
import { addLayer, removeLayer, addSource, removeSource } from '@carto/react-redux';

import { makeStyles } from '@material-ui/core/styles';
import { Grid } from '@material-ui/core';

const useStyles = makeStyles(() => ({
  boundaries: {},
}));

export default function Boundaries() {
  const dispatch = useDispatch();
  const classes = useStyles();

  useEffect(() => {
    dispatch(addSource(boundariesSource));

    dispatch(
      addLayer({
        id: BOUNDARIES_LAYER_ID,
        source: boundariesSource.id,
      })
    );

    return () => {
      dispatch(removeLayer(BOUNDARIES_LAYER_ID));
      dispatch(removeSource(boundariesSource.id));
    };
  }, [dispatch]);

  // [hygen] Add useEffect

  return (
    <Grid container direction='column' className={classes.boundaries}>
      <Grid item>Hello World</Grid>
    </Grid>
  );
}
