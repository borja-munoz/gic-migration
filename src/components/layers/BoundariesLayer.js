import { useDispatch, useSelector } from 'react-redux';
import { useMemo, useEffect, useState } from 'react';
import PolygonLabelLayer from './PolygonLabelLayer.js';
import { WebMercatorViewport } from 'deck.gl';
import { fetchLayerData } from '@deck.gl/carto';
import { selectSourceById } from '@carto/react-redux';
import { useCartoLayerProps } from '@carto/react-api';
import htmlForFeature from 'utils/htmlForFeature';
import { setLayerIsLoadingData } from 'store/appSlice';
import simplify from '@turf/simplify';
import bboxClip from '@turf/bbox-clip';
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
  const [layerFeatures, setLayerFeatures] = useState([]);
  const [dataLabels, setDataLabels] = useState([]);

  let layer;
  let scale = Math.pow(2, Math.floor(15 - viewState.zoom));
  scale = Math.min(1024, Math.max(2, scale));

  const calculateLabelLocations = () => {
    const viewport = new WebMercatorViewport(viewState);

    let layerDataLabels = [];

    // Calculate the length for all the edges in the polygon
    layerFeatures.forEach((originalFeature) => {
      // First we simplify and clip the feature
      const simplifiedFeature = simplify(originalFeature, { tolerance: 0.01 });
      const clippedFeature = bboxClip(simplifiedFeature, viewport.getBounds());
      let edges = [];
      for (let i = 0; i < clippedFeature.geometry.coordinates[0].length - 1; i++) {
        const x1 = clippedFeature.geometry.coordinates[0][i][0];
        const y1 = clippedFeature.geometry.coordinates[0][i][1];
        const x2 = clippedFeature.geometry.coordinates[0][i + 1][0];
        const y2 = clippedFeature.geometry.coordinates[0][i + 1][1];
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
        edges.push({
          x1,
          y1,
          x2,
          y2,
          length,
        });
      }

      // Sorts the edges by length in descending order
      edges.sort((a, b) => b.length - a.length);


      // ToDo:
      // [x] Multiple labels for the same polygon if the edge is long enough (in pixels)
      // [x] Clip the polygon against the viewport before calculating labels
      // [x] Update labels on view state change
      // [ ] Label collision (tag map)
      // [ ] Multiple labels in the same edge when the edge is longer than some amount
      // [ ] Calculate the amount of labels for a given edge taking into account
      //   the space occupied by each label

      // Loop through the edges and add a label to all the edges
      // with length > 100 px (or the longest edge if there is no edge with more than 100 px)
      let positions = [];
      let angles = [];
      for (const edge of edges) {
        // Calculate length in pixels
        const startVertexPixels = viewport.project([edge.x1, edge.y1]);
        const endVertexPixels = viewport.project([edge.x2, edge.y2]);
        const dxPixels = endVertexPixels[0] - startVertexPixels[0];
        const dyPixels = endVertexPixels[1] - startVertexPixels[1];
        const lengthPixels = Math.sqrt(Math.pow(dxPixels, 2) + Math.pow(dyPixels, 2));

        if (positions.length == 0 || lengthPixels > 100) {
          // Label in the midpoint
          const sumX = edge.x1 + edge.x2;
          const sumY = edge.y1 + edge.y2;
          const midPoint = [sumX / 2, sumY / 2];
          positions.push(midPoint);

          // Angle of inclination (X axis)
          const dx = edge.x1 - edge.x2;
          const dy = edge.y1 - edge.y2;
          // const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
          const angle = (Math.atan(dy / dx) * 180) / Math.PI;
          angles.push(angle);
        } else {
          break;
        }
      }
      // Assign the same label to all the features
      for (let i = 0; i < positions.length; i++) {
        layerDataLabels.push({
          text: originalFeature.properties['provider_short_name'],
          textPosition: positions[i],
          angle: angles[i]    
        })
      }
    });

    setDataLabels(layerDataLabels);
  };

  const dataLoaded = (data) => {
    setLayerFeatures(data.features);
    dispatch(setLayerIsLoadingData(false));
    cartoLayerProps.onDataLoad(data);
  };

  // Update label locations when the features are loaded or when the viewstate is updated
  useEffect(() => {
    calculateLabelLocations();
  }, [layerFeatures, viewState]);

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
      dataLabels,
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
