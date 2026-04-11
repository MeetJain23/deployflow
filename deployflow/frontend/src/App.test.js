import { render, screen } from '@testing-library/react';
import App from './App';

test('renders DeployFlow app', () => {
  render(<App />);
  const el = screen.getByText(/DeployFlow/i);
  expect(el).toBeInTheDocument();
});
