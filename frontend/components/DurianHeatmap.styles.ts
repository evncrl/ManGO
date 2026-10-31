import { StyleSheet } from 'react-native';
import { Fonts, Palette } from '@/constants/theme';

const styles = StyleSheet.create({
  mapCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 24,
    padding: 24,
    margin: 16,
    // Removed border for clean look
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
    color: Palette.warmCopper,
  },
  mapSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Palette.charcoalEspresso,
  },
  controlButtons: {
    flexDirection: 'row',
    marginTop: 12,
  },
  controlButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  controlButtonActive: {
    backgroundColor: Palette.warmCopper,
  },
  controlButtonText: {
    color: Palette.deepObsidian,
    fontFamily: Fonts.semiBold,
  },
  mapViewport: {
    height: 400,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#F3F4F6',
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
    color: '#888',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 8,
  },
  mapLegend: {
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Palette.white,
  },
  legendTitle: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: Palette.deepObsidian,
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
    color: Palette.charcoalEspresso,
  },
});

export default styles;
