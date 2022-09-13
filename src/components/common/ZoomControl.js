import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  makeStyles,
  Tooltip,
  Typography,
} from '@material-ui/core';
import AddOutlinedIcon from '@material-ui/icons/AddOutlined';
import RemoveOutlinedIcon from '@material-ui/icons/RemoveOutlined';
import { setViewState } from '@carto/react-redux';

const useStyles = makeStyles((theme) => ({
  zoomControl: {
    backgroundColor: theme.palette.background.paper,
    width: 'auto',
  },
  loading: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

const MINIMUN_ZOOM_LEVEL = 0;
const MAXIMUM_ZOOM_LEVEL = 20;

export default function ZoomControl({ className, showCurrentZoom, isLoading = false }) {
  const dispatch = useDispatch();
  const zoomLevel = useSelector((state) => Math.floor(state.carto.viewState.zoom));
  const classes = useStyles();

  const increaseZoom = useCallback(() => {
    const nextZoom = zoomLevel + 1;
    if (nextZoom <= MAXIMUM_ZOOM_LEVEL) {
      dispatch(setViewState({ zoom: nextZoom }));
    }
  }, [dispatch, zoomLevel]);

  const decreaseZoom = useCallback(() => {
    const nextZoom = zoomLevel - 1;
    if (nextZoom >= MINIMUN_ZOOM_LEVEL) {
      dispatch(setViewState({ zoom: nextZoom }));
    }
  }, [dispatch, zoomLevel]);

  return (
    <Grid
      container
      direction='row'
      alignItems='center'
      className={`${className} ${classes.zoomControl}`}
    >
      <IconButton onClick={decreaseZoom} aria-label='Decrease zoom'>
        <RemoveOutlinedIcon />
      </IconButton>
      <Divider orientation='vertical' flexItem />
      {isLoading && (
        <div className={classes.loading}>
          <Tooltip title='Loading...' arrow placement='right'>
            <CircularProgress color='primary' size={28} />
          </Tooltip>
        </div>
      )}
      {showCurrentZoom && (
        <Box px={1} minWidth={36}>
          <Typography
            display='block'
            align='center'
            color='textSecondary'
            variant='overline'
          >
            {zoomLevel}
          </Typography>
        </Box>
      )}
      <Divider orientation='vertical' flexItem />
      <IconButton onClick={increaseZoom} aria-label='Increase zoom'>
        <AddOutlinedIcon />
      </IconButton>
    </Grid>
  );
}
