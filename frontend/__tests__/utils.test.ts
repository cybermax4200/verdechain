import { cn } from '../lib/utils';

describe('cn utility', () => {
  it('should merge plain class names', () => {
    const result = cn('text-sm', 'font-medium', 'text-gray-900');
    expect(result).toBe('text-sm font-medium text-gray-900');
  });

  it('should resolve conflicting Tailwind classes using tailwind-merge', () => {
    const result = cn('p-4', 'p-2', 'bg-red-500', 'bg-blue-500');
    expect(result).toBe('p-2 bg-blue-500');
  });

  it('should filter out falsy values, undefined, and null', () => {
    const isPrimary = false;
    const isVisible = true;
    const result = cn(
      'btn',
      isPrimary && 'btn-primary',
      isVisible && 'visible',
      null,
      undefined,
      false,
    );
    expect(result).toBe('btn visible');
  });

  it('should handle nested arrays and object format', () => {
    const result = cn(['px-4', 'py-2'], { 'opacity-50': true, 'opacity-0': false });
    expect(result).toBe('px-4 py-2 opacity-50');
  });
});
