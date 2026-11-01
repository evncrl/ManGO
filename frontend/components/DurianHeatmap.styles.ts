import { StyleSheet } from 'react-native';
import { Fonts, Palette } from '@/constants/theme';

const styles = StyleSheet.create({
  mapCard: {
    backgroundColor: Palette.surface,
    borderRadius: 24,
    padding: 24,
    margin: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    elevation: 5,
  },
  mapControls: {
    marginBottom: 16,
  },
  mapTitleSection: {
    marginBottom: 8,
  },
  mapTitle: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: Palette.charcoal,
  },
  mapSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Palette.body,
  },
  controlButtons: {
    flexDirection: 'row',
    marginTop: 12,
  },
  controlButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Palette.sand,
    marginRight: 8,
  },
  controlButtonActive: {
    backgroundColor: Palette.warmCopper,
  },
  controlButtonText: {
    color: Palette.charcoal,
    fontFamily: Fonts.semiBold,
  },
  mapViewport: {
    height: 400,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: Palette.canvas,
  },
  mapLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapLoadingText: {
    marginTop: 12,
    color: '#15803d',
    fontSize: 15,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  mapPlaceholderText: {
    color: Palette.body,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 8,
  },
  mapLegend: {
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Palette.sand,
  },
  legendTitle: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: Palette.charcoal,
    marginBottom: 10,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  legendColor: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 6,
  },
  legendText: {
    fontSize: 13,
    color: Palette.body,
  },
});

export default styles;
