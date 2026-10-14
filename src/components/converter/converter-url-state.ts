/**
 * URL State parser and serializer for the Mbps <-> MB/s Bidirectional Converter.
 * Independent of the frozen Calculator URL state.
 */

export interface ConverterState {
  value: number;
  from: 'mbps' | 'mbs';
}

export const DEFAULT_CONVERTER_STATE: ConverterState = {
  value: 100,
  from: 'mbps',
};

export function parseConverterState(params: URLSearchParams): ConverterState {
  const fromRaw = params.get('from');
  const from: 'mbps' | 'mbs' = fromRaw === 'mbs' ? 'mbs' : 'mbps';
  const valueRaw = params.get('value');

  if (valueRaw !== null) {
    const num = Number(valueRaw);
    if (!Number.isNaN(num) && Number.isFinite(num) && num >= 0) {
      return { value: num, from };
    }
  }

  return {
    value: from === 'mbs' ? 12.5 : 100,
    from,
  };
}

export function serializeConverterState(state: ConverterState): string {
  const params = new URLSearchParams();
  params.set('value', state.value.toString());
  params.set('from', state.from);
  return params.toString();
}
