import { describe, it, expect } from 'vitest';
import { ConnectionNode } from './ConnectionNode';

describe('ConnectionNode Component', () => {
  it('should export ConnectionNode component', () => {
    expect(ConnectionNode).toBeDefined();
    expect(typeof ConnectionNode).toBe('function');
  });

  it('should accept isActive prop', () => {
    const component = ConnectionNode({ isActive: true });
    expect(component).toBeDefined();
  });

  it('should accept isConnecting prop', () => {
    const component = ConnectionNode({ isActive: false, isConnecting: true });
    expect(component).toBeDefined();
  });

  it('should accept label prop', () => {
    const component = ConnectionNode({ isActive: true, label: 'Test' });
    expect(component).toBeDefined();
  });

  it('should handle all props together', () => {
    const component = ConnectionNode({
      isActive: true,
      isConnecting: false,
      label: 'Test Node',
    });
    expect(component).toBeDefined();
  });

  it('should render without label', () => {
    const component = ConnectionNode({ isActive: true });
    expect(component).toBeDefined();
  });

  it('should render in different states', () => {
    const states = [
      { isActive: true },
      { isActive: false },
      { isActive: true, isConnecting: true },
      { isActive: false, isConnecting: true },
      { isActive: true, label: 'Active' },
      { isActive: false, label: 'Inactive' },
    ];

    states.forEach((state) => {
      const component = ConnectionNode(state);
      expect(component).toBeDefined();
    });
  });
});
