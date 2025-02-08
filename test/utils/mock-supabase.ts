import { vi } from 'vitest';

interface MockResponse<T = unknown> {
  data: T | null;
  error: Error | null;
}

interface MockSupabaseClient {
  from: ReturnType<typeof vi.fn>;
  channel: ReturnType<typeof vi.fn>;
  removeChannel: ReturnType<typeof vi.fn>;
  _mock: {
    select: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    gte: ReturnType<typeof vi.fn>;
    lte: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
    mockSelectSuccess: (data: unknown) => MockSupabaseClient;
    mockSelectError: (error: Error) => MockSupabaseClient;
    reset: () => MockSupabaseClient;
    getCurrentResponse: () => MockResponse;
    updateCurrentResponse: (newData: unknown) => void;
  };
}

export function createMockSupabaseClient(): MockSupabaseClient {
  let mockResponse: MockResponse = { data: null, error: null };

  const mockSingle = vi.fn().mockImplementation(() => Promise.resolve(mockResponse));
  
  const mockExecute = vi.fn().mockImplementation(() => Promise.resolve(mockResponse));

  const createChainedMock = (methods: Record<string, ReturnType<typeof vi.fn>>) => {
    const chainedMock = {
      ...methods,
      then: (resolve: (value: MockResponse) => void) => Promise.resolve(mockResponse).then(resolve)
    };
    return vi.fn().mockReturnValue(chainedMock);
  };

  const mockLte = createChainedMock({ 
    single: mockSingle,
    execute: mockExecute
  });

  const mockGte = createChainedMock({ 
    lte: mockLte,
    single: mockSingle,
    execute: mockExecute
  });
  
  const mockEq = createChainedMock({ 
    single: mockSingle,
    gte: mockGte,
    lte: mockLte,
    execute: mockExecute
  });
  
  const mockSelect = createChainedMock({ 
    eq: mockEq,
    gte: mockGte,
    lte: mockLte,
    single: mockSingle,
    execute: mockExecute
  });
  
  const mockUpdate = createChainedMock({ 
    eq: mockEq,
    single: mockSingle,
    execute: mockExecute
  });
  
  const mockInsert = createChainedMock({ 
    single: mockSingle,
    execute: mockExecute
  });

  const mockFrom = vi.fn().mockReturnValue({
    select: mockSelect,
    update: mockUpdate,
    insert: mockInsert,
  });

  const mockSubscribe = vi.fn().mockImplementation(() => {
    return { data: null, error: null };
  });

  const mockOn = vi.fn().mockReturnValue({ subscribe: mockSubscribe });
  const mockChannel = vi.fn().mockReturnValue({ on: mockOn });
  const mockRemoveChannel = vi.fn();

  const mock = {
    from: mockFrom,
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
    _mock: {
      select: mockSelect,
      update: mockUpdate,
      insert: mockInsert,
      eq: mockEq,
      gte: mockGte,
      lte: mockLte,
      single: mockSingle,
      on: mockOn,
      subscribe: mockSubscribe,
      mockSelectSuccess: (data: unknown) => {
        mockResponse = { data, error: null };
        mockExecute.mockImplementation(() => Promise.resolve({ data, error: null }));
        mockSingle.mockImplementation(() => Promise.resolve({ data, error: null }));
        return mock;
      },
      mockSelectError: (error: Error) => {
        mockResponse = { data: null, error };
        mockExecute.mockImplementation(() => Promise.resolve({ data: null, error }));
        mockSingle.mockImplementation(() => Promise.resolve({ data: null, error }));
        return mock;
      },
      reset: () => {
        mockResponse = { data: null, error: null };
        mockExecute.mockImplementation(() => Promise.resolve({ data: null, error: null }));
        mockSingle.mockImplementation(() => Promise.resolve({ data: null, error: null }));
        return mock;
      },
      getCurrentResponse: () => mockResponse,
      updateCurrentResponse: (newData: unknown) => {
        mockResponse = { data: newData, error: null };
        mockExecute.mockImplementation(() => Promise.resolve({ data: newData, error: null }));
        mockSingle.mockImplementation(() => Promise.resolve({ data: newData, error: null }));
      }
    }
  };

  return mock;
}

// Export a singleton instance for convenience
export const mockSupabaseClient = createMockSupabaseClient(); 