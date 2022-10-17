import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PolygonLabelCartoLayer from './PolygonLabelCartoLayer.js';
import { selectSourceById } from '@carto/react-redux';
import { useCartoLayerProps } from '@carto/react-api';
import htmlForFeature from 'utils/htmlForFeature';
import { setLayerIsLoadingData } from 'store/appSlice';
import { FillStyleExtension } from '@deck.gl/extensions';
import LabelLocations from './labelLocations.js';

const patterns = ['dots', 'hatch-1x', 'hatch-2x', 'hatch-cross'];

export const BOUNDARIES_CARTO_LAYER_ID = 'boundariesCartoLayer';

export default function BoundariesCartoLayer() {
  const { boundariesCartoLayer } = useSelector((state) => state.carto.layers);
  const viewState = useSelector((state) => state.carto.viewState);
  const source = useSelector((state) =>
    selectSourceById(state, boundariesCartoLayer?.source)
  );
  const cartoLayerProps = useCartoLayerProps({ source, uniqueIdProperty: 'cartodb_id' });
  const { fetch, ...myCartoLayerProps } = cartoLayerProps; // Don't use the fetch function provided by the hook
  const dispatch = useDispatch();
  const [layerFeatures, setLayerFeatures] = useState([]);
  const [dataLabels, setDataLabels] = useState([]);

  let layer;
  let scale = Math.pow(2, Math.floor(15 - viewState.zoom));
  scale = Math.min(1024, Math.max(2, scale));

  const viewportLoaded = (data) => {
    dispatch(setLayerIsLoadingData(false));
    setLayerFeatures(layer.getSubLayers()[0].getSubLayers()[0].getRenderedFeatures());
  };

  const tileLoaded = () => {
    dispatch(setLayerIsLoadingData(true));
  };

  // Update label locations when the features are loaded or when the viewstate is updated
  useEffect(() => {
    setDataLabels(LabelLocations(layerFeatures, viewState));
  }, [layerFeatures, viewState]);

  if (boundariesCartoLayer && source) {
    layer = new PolygonLabelCartoLayer({
      ...myCartoLayerProps,
      sourceData: source.data,
      dataLabels,
      id: BOUNDARIES_CARTO_LAYER_ID,

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
      onViewportLoad: viewportLoaded,
      onTileLoad: tileLoaded,

      fillPatternMask: true,
      fillPatternAtlas:
        'https://raw.githubusercontent.com/visgl/deck.gl/master/examples/layer-browser/data/pattern.png',
      fillPatternMapping:
        'https://raw.githubusercontent.com/visgl/deck.gl/master/examples/layer-browser/data/pattern.json',
      getFillPattern: (f) => {
        if (f.properties.provider_short_name === 'OMB') {
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
