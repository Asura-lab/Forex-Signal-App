import { formatNumber, formatPercent, getSignalColor, SIGNAL_TYPES } from '../helpers';

describe('Helper Functions', () => {
  describe('formatNumber', () => {
    it('formats number to default 2 decimal places', () => {
      expect(formatNumber(1.23456)).toBe('1.23');
    });

    it('formats number to specified decimal places', () => {
      expect(formatNumber(1.23456, 4)).toBe('1.2346');
    });

    it('handles zero', () => {
      expect(formatNumber(0)).toBe('0.00');
    });

    it('handles null or undefined', () => {
      expect(formatNumber(null)).toBe('0.00');
      expect(formatNumber(undefined)).toBe('0.00');
    });
  });

  describe('formatPercent', () => {
    it('formats number with % sign', () => {
      expect(formatPercent(12.34)).toBe('12.3%');
    });
  });

  describe('getSignalColor', () => {
    it('returns correct color for STRONG BUY', () => {
      // 4 is STRONG BUY
      expect(getSignalColor(4)).toBe(SIGNAL_TYPES[4].color);
    });

    it('returns default color for unknown signal', () => {
      expect(getSignalColor(99)).toBe('#9E9E9E');
    });
  });
});
