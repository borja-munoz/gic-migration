import { useDispatch, useSelector } from 'react-redux';
import { useMemo, useEffect } from 'react';
import PolygonLabelLayer from './PolygonLabelLayer.js';
import { WebMercatorViewport } from 'deck.gl';
import { fetchLayerData } from '@deck.gl/carto';
import { selectSourceById } from '@carto/react-redux';
import { useCartoLayerProps } from '@carto/react-api';
import htmlForFeature from 'utils/htmlForFeature';
import { setLayerIsLoadingData } from 'store/appSlice';
import simplify from '@turf/simplify';
import { FillStyleExtension } from '@deck.gl/extensions';

const patterns = ['dots', 'hatch-1x', 'hatch-2x', 'hatch-cross'];

export const BOUNDARIES_LAYER_ID = 'boundariesLayer';

export default function BoundariesLayer() {
  const { boundariesLayer } = useSelector((state) => state.carto.layers);
  const source = useSelector((state) => selectSourceById(state, boundariesLayer?.source));
  const viewState = useSelector((state) => state.carto.viewState);
  const cartoLayerProps = useCartoLayerProps({ source, uniqueIdProperty: 'cartodb_id' });
  const { fetch, ...myCartoLayerProps } = cartoLayerProps; // Don't use the fetch function provided by the hook
  const dispatch = useDispatch();

  let layer;
  let scale = Math.pow(2, Math.floor(15 - viewState.zoom));;
  scale = Math.min(1024, Math.max(2, scale));

  const calculateLabelLocations = (features) => {
    const viewport = new WebMercatorViewport(viewState);
    features.forEach((originalFeature) => {
      const feature = simplify(originalFeature, { tolerance: 0.01 });
      let longestEdgeLength = 0;
      let longestEdgeInitialCoordIndex = 0;
      for (let i = 0; i < feature.geometry.coordinates[0].length - 1; i++) {
        const dx =
          feature.geometry.coordinates[0][i + 1][0] -
          feature.geometry.coordinates[0][i][0];
        const dy =
          feature.geometry.coordinates[0][i + 1][1] -
          feature.geometry.coordinates[0][i][1];
        const length = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
        if (length > longestEdgeLength) {
          longestEdgeLength = length;
          longestEdgeInitialCoordIndex = i;
        }
      }
      originalFeature.properties['text'] = feature.properties['provider_short_name'];

      // Calculate length in pixels
      const startVertexPixels = viewport.project([
        feature.geometry.coordinates[0][longestEdgeInitialCoordIndex][0],
        feature.geometry.coordinates[0][longestEdgeInitialCoordIndex][1],
      ]);
      const endVertexPixels = viewport.project([
        feature.geometry.coordinates[0][longestEdgeInitialCoordIndex + 1][0],
        feature.geometry.coordinates[0][longestEdgeInitialCoordIndex + 1][1],
      ]);
      const dxPixels = endVertexPixels[0] - startVertexPixels[0];
      const dyPixels = endVertexPixels[1] - startVertexPixels[1];
      const lengthPixels = Math.sqrt(Math.pow(dxPixels, 2) + Math.pow(dyPixels, 2));

      // Label in the midpoint
      const sumX =
        feature.geometry.coordinates[0][longestEdgeInitialCoordIndex][0] +
        feature.geometry.coordinates[0][longestEdgeInitialCoordIndex + 1][0];
      const sumY =
        feature.geometry.coordinates[0][longestEdgeInitialCoordIndex][1] +
        feature.geometry.coordinates[0][longestEdgeInitialCoordIndex + 1][1];
      const midPoint = [sumX / 2, sumY / 2];
      originalFeature.properties['textPosition'] = midPoint;

      // Angle of inclination (X axis)
      const dx =
        feature.geometry.coordinates[0][longestEdgeInitialCoordIndex][0] -
        feature.geometry.coordinates[0][longestEdgeInitialCoordIndex + 1][0];
      const dy =
        feature.geometry.coordinates[0][longestEdgeInitialCoordIndex][1] -
        feature.geometry.coordinates[0][longestEdgeInitialCoordIndex + 1][1];
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      originalFeature.properties['angle'] = angle;
    });
  };

  const dataLoaded = (data) => {
    calculateLabelLocations(data.features);
    dispatch(setLayerIsLoadingData(false));
    cartoLayerProps.onDataLoad(data);
  };

  const dataPromise = useMemo(
    () =>
      source?.data &&
      dispatch(setLayerIsLoadingData(true)) &&
      fetchLayerData({
        type: source.type,
        connection: source.connection,
        source: source.data,
        format: 'geojson',
      }),
    [source?.type, source?.data, source?.connection]
  );

  if (boundariesLayer && source) {
    layer = new PolygonLabelLayer({
      ...myCartoLayerProps,
      data: dataPromise,
      dataTransform: (res) => res.data,
      id: BOUNDARIES_LAYER_ID,

      getFillColor: (f) => {
        const alpha = 255 - viewState.zoom * 10;
        switch (f.properties.provider_short_name) {
          case 'REIS':
            return [255, 0, 0, alpha];
          case 'OMB':
            return [200, 200, 200, alpha];
          case 'CBRE':
            return [0, 255, 0, alpha];
          default:
            return [255, 0, 0, alpha];
        }
      },
      getLineColor: (f) => {
        switch (f.properties.provider_short_name) {
          case 'REIS':
            return [255, 0, 0];
          case 'OMB':
            return [200, 200, 200];
          case 'CBRE':
            return [0, 255, 0];
          default:
            return [255, 0, 0];
        }
      },
      lineWidthMinPixels: 1,

      pickable: true,
      onHover: (info) => {
        if (info?.object) {
          info.object = {
            html: htmlForFeature({ feature: info.object }),
            style: {},
          };
        }
      },
      onDataLoad: dataLoaded,

      fillPatternMask: true,
      fillPatternAtlas:
        'https://raw.githubusercontent.com/visgl/deck.gl/master/examples/layer-browser/data/pattern.png',
      fillPatternMapping:
        'https://raw.githubusercontent.com/visgl/deck.gl/master/examples/layer-browser/data/pattern.json',
      getFillPattern: (f) => {
        if (f.properties.provider_short_name == 'OMB') {
          return patterns[1];
        }
      },
      getFillPatternScale: () => scale,
      getFillPatternOffset: [0, 0],

      extensions: [new FillStyleExtension({ pattern: true })],

      updateTriggers: {
        getFillColor: [viewState.zoom],
        getFillPatternScale: [scale],
        ...cartoLayerProps.updateTriggers,
      },
    });

    return layer;
  }
}
