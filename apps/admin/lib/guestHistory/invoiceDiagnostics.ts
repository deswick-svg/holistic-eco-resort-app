export type InvoiceFailureStage =
  | 'authentication'
  | 'request_parsing'
  | 'fresh_preparation'
  | 'draft_mapping'
  | 'repository_factory'
  | 'repository_begin';

export type InvoiceFailureReporter = (stage: InvoiceFailureStage, error: unknown) => void;

/** Logs only a stage and bounded error classification. Never pass request data. */
export const reportInvoiceStageFailure: InvoiceFailureReporter = (stage, error) => {
  const candidate = error && typeof error === 'object' ? error as { name?: unknown; code?: unknown } : undefined;
  const errorType = typeof candidate?.name === 'string' && /^[A-Za-z][A-Za-z0-9]{0,79}$/.test(candidate.name)
    ? candidate.name : 'UnknownError';
  const errorCode = typeof candidate?.code === 'string' && /^[A-Z][A-Z0-9_]{0,79}$/.test(candidate.code)
    ? candidate.code : undefined;
  console.error('Guarded invoice stage failed', { stage, errorType, ...(errorCode ? { errorCode } : {}) });
};
