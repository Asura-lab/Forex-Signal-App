import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CurrencyCard from '../CurrencyCard';

const mockPair = {
  id: 'EUR_USD',
  name: 'EUR/USD',
  displayName: 'EURUSD',
  color: '#000000',
};

const mockColors = {
  success: 'green',
  error: 'red',
  textSecondary: 'gray',
  background: 'white',
  card: 'white',
  border: 'gray',
  textPrimary: 'black'
};

describe('CurrencyCard', () => {
  it('renders correctly with positive change', () => {
    const { getByText } = render(
      <CurrencyCard
        pair={mockPair}
        liveRate={{ rate: 1.12345, change: 0.00100, change_percent: 0.12 }}
        onPress={() => {}}
        loading={false}
        colors={mockColors}
      />
    );

    expect(getByText('EURUSD')).toBeTruthy();
    expect(getByText('1.12345')).toBeTruthy();
    expect(getByText('+0.00100')).toBeTruthy();
    expect(getByText('+0.12%')).toBeTruthy();
  });

  it('renders correctly with negative change', () => {
    const { getByText } = render(
      <CurrencyCard
        pair={mockPair}
        liveRate={{ rate: 1.10000, change: -0.00200, change_percent: -0.25 }}
        onPress={() => {}}
        loading={false}
        colors={mockColors}
      />
    );

    expect(getByText('1.10000')).toBeTruthy();
    expect(getByText('-0.00200')).toBeTruthy(); // My format function added '-'? No, I said `prefix + value`?
    // Let's check logic: isNegative -> prefix = value > 0 ? "+" : ""; 
    // if value is -0.002, prefix is "". 
    // value.toFixed(5) -> "-0.00200".
    // So result is "-0.00200". Correct.
    expect(getByText('-0.25%')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <CurrencyCard
        pair={mockPair}
        liveRate={{ rate: 1.12345 }}
        onPress={onPressMock}
        loading={false}
        colors={mockColors}
      />
    );

    fireEvent.press(getByText('EURUSD'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
});
