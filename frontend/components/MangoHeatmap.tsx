import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import styles from './MangoHeatmap.styles';
import { useResponsive } from '@/utils/platform';

const MANGO_DATA = [
  { id: 1, province: "Pangasinan / Ilocos Region", lat: 16.03, lon: 120.33, production: 30000 },
  { id: 2, province: "Guimaras / Iloilo", lat: 10.55, lon: 122.60, production: 26000 },
  { id: 3, province: "Zambales", lat: 15.32, lon: 119.98, production: 22000 },
  { id: 4, province: "Cebu", lat: 10.31, lon: 123.89, production: 8000 },
  { id: 5, province: "Bukidnon / Northern Mindanao", lat: 8.15, lon: 125.12, production: 7000 },
  { id: 6, province: "General Santos / South Cotabato", lat: 6.11, lon: 125.17, production: 6000 }
];

interface HeatmapProps {
  mapMode: 'heatmap' | 'scatter';
  onMapModeChange: (mode: 'heatmap') => void;
  onRegionSelect: (region: any) => void;
  plotlyLoaded: boolean;
  onPlotlyLoad: () => void;
}

export default function MangoHeatmap(props: HeatmapProps) {
  const { mapMode, onMapModeChange, onRegionSelect, plotlyLoaded, onPlotlyLoad } = props;
  const plotRef = useRef<HTMLDivElement>(null);
  const { isWeb } = useResponsive();

  // Load Plotly.js for web
  useEffect(() => {
    if (isWeb && !plotlyLoaded) {
      console.log('[MangoHeatmap] Loading Plotly.js...');
      const script = document.createElement('script');
      script.src = 'https://cdn.plot.ly/plotly-2.24.1.min.js';
      script.onload = () => {
        console.log('[MangoHeatmap] Plotly.js loaded');
        onPlotlyLoad();
        renderMap();
      };
      script.onerror = () => {
        console.error('[MangoHeatmap] Failed to load Plotly.js');
      };
      document.head.appendChild(script);
      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    }
  }, [isWeb, plotlyLoaded]);

  useEffect(() => {
    if (isWeb && plotlyLoaded) {
      console.log('[MangoHeatmap] Rendering map...');
      renderMap();
    }
  }, [isWeb, plotlyLoaded, mapMode]);

  const renderMap = () => {
    if (!plotRef.current) {
      console.warn('[MangoHeatmap] plotRef.current is null');
      return;
    }
    if (!(window as any).Plotly) {
      console.warn('[MangoHeatmap] Plotly not available on window');
      return;
    }

    const { Plotly } = (window as any);

    // Store current div reference
    const plotDiv = plotRef.current;

    // Clear previous plot if exists
    Plotly.purge(plotDiv);

    // Prepare data based on map mode
    let trace;

    if (mapMode === 'heatmap') {
      // Heatmap mode (normalized and contrast-adjusted)
      const maxProduction = Math.max(...MANGO_DATA.map(d => d.production));
      trace = {
        type: 'densitymapbox',
        lat: MANGO_DATA.map(d => d.lat),
        lon: MANGO_DATA.map(d => d.lon),
        // Normalize to 0..1 so colorscale maps consistently
        z: MANGO_DATA.map(d => d.production / maxProduction),
        zmin: 0,
        zmax: 1,
        radius: 60,
        colorscale: [
          [0, 'rgba(0, 255, 0, 0.06)'],
          [0.2, 'rgba(255, 255, 0, 0.65)'],
          [0.5, 'rgba(255, 165, 0, 0.85)'],
          [0.8, 'rgba(255, 100, 0, 0.95)'],
          [1, 'rgba(255, 0, 0, 1)']
        ],
        hoverinfo: 'text',
        text: MANGO_DATA.map(d =>
          `<b>${d.province}</b><br>Production: ${d.production.toLocaleString()} MT<br>(${((d.production / maxProduction) * 100).toFixed(1)}% of top producer)`
        ),
        showscale: true,
        colorbar: {
          title: {
            text: 'Production (relative)',
            font: { color: '#1C1917' }
          },
          tickfont: { color: '#1C1917' },
          titleside: 'right'
        }
      };
    } else {
      // Scatter mode
      trace = {
        type: 'scattermapbox',
        lat: MANGO_DATA.map(d => d.lat),
        lon: MANGO_DATA.map(d => d.lon),
        mode: 'markers',
        marker: {
          size: MANGO_DATA.map(d => Math.max(10, d.production / 1500)),
          color: MANGO_DATA.map(d => d.production),
          colorscale: 'YlOrRd',
          showscale: true,
          colorbar: {
            title: {
              text: 'Production (MT)',
              font: { color: '#1C1917' }
            },
            tickfont: { color: '#1C1917' },
            titleside: 'right'
          },
          opacity: 0.8
        },
        text: MANGO_DATA.map(d => d.province),
        hoverinfo: 'text',
        customdata: MANGO_DATA,
        hovertemplate:
          '<b>%{text}</b><br>' +
          'Production: %{customdata.production:,} MT<br>' +
          '<extra></extra>'
      };
    }

    const layout = {
      title: {
        text: 'Philippines Mango Production & Distribution',
        font: { size: 20, family: 'Montserrat, sans-serif', color: '#1C1917' }
      },
      autosize: true,
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      mapbox: {
        style: 'open-street-map', // Most reliable style, no token issues
        center: { lat: 12.5, lon: 122.5 },
        zoom: 4,
        minzoom: 3,
        bearing: 0,
        pitch: 0,
        bounds: {
          west: 116.5,
          east: 127.5,
          south: 4.0,
          north: 21.5
        }
      },
      margin: { t: 70, b: 20, l: 20, r: 20 },
      hovermode: 'closest',
      showlegend: false,
      dragmode: 'pan'
    };

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['lasso2d', 'select2d'],
      
      // Set view constraints
      scrollZoom: true,
      doubleClick: 'reset+autosize'
    };

    Plotly.newPlot(plotDiv, [trace], layout, config).then(() => {
      // Cast to any to bypass TypeScript checking
      (plotDiv as any).on('plotly_click', function (data: any) {
        if (data.points && data.points[0]) {
          const pointIndex = data.points[0].pointIndex;
          if (pointIndex >= 0 && pointIndex < MANGO_DATA.length) {
            onRegionSelect(MANGO_DATA[pointIndex]);
          }
        }
      });
    }).catch((err: any) => {
      console.error('Plotly error:', err);
    });
  };

  const getProductionColor = (production: number) => {
    if (production > 20000) return '#FF6B6B';
    if (production > 8000) return '#FFA726';
    if (production > 3000) return '#FFD166';
    return '#4ECDC4';
  };

  return (
    <View style={styles.mapCard}>
      {/* Map Controls */}
      <View style={styles.mapControls}>
        <View style={styles.mapTitleSection}>
          <Text style={styles.mapTitle}>Philippines Mango Production &amp; Distribution</Text>
          <Text style={styles.mapSubtitle}>
            {mapMode === 'heatmap'
              ? 'Heat map visualization of production intensity'
              : 'Bubble size represents production volume'}
          </Text>
        </View>

        <View style={styles.controlButtons}>
          <TouchableOpacity
            style={[styles.controlButton, mapMode === 'heatmap' && styles.controlButtonActive]}
            onPress={() => onMapModeChange('heatmap')}
          >
            <Text style={styles.controlButtonText}>🔥 Heat Map</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Map Container */}
      <View style={styles.mapViewport}>
        {isWeb ? (
          plotlyLoaded ? (
            <div
              ref={plotRef}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '12px',
                overflow: 'hidden'
              }}
            />
          ) : (
            <View style={styles.mapLoading}>
              <ActivityIndicator size="large" color="#15803d" />
              <Text style={styles.mapLoadingText}>Loading Mango Production Map...</Text>
            </View>
          )
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>
              Interactive heat map is only available on web.
            </Text>
            <Text style={styles.mapPlaceholderText}>
              Open this app in a browser for the full experience.
            </Text>
          </View>
        )}
      </View>

      {/* Legend */}
      <View style={styles.mapLegend}>
        <Text style={styles.legendTitle}>Production Intensity</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4ECDC4' }]} />
            <Text style={styles.legendText}>Low (&lt;3K MT)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FFD166' }]} />
            <Text style={styles.legendText}>Medium (3-8K)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FFA726' }]} />
            <Text style={styles.legendText}>High (8-20K)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FF6B6B' }]} />
            <Text style={styles.legendText}>Highest (&gt;20K)</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// Export the data for use in other components
export { MANGO_DATA };
