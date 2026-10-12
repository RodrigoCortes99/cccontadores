export const DOCUMENT_LIBRARY_UNAVAILABLE = {
  title: 'Biblioteca documental no disponible',
  description: 'Esta función todavía no está habilitada. Puedes seguir consultando las solicitudes y archivos de tus clientes en Documentos PBC.',
  href: '/panel/documentos',
};

export class DocumentLibraryError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, body: unknown) {
    const data = body && typeof body === 'object' ? body as Record<string, unknown> : {};
    const legacyDisabled = data.detail === 'CAROVA_DESHABILITADA' ||
      data.detail === 'Capacidad documental no habilitada en este entorno.';
    const code = legacyDisabled ? 'DOCUMENT_INTELLIGENCE_DISABLED' :
      typeof data.code === 'string' ? data.code : '';
    const detail = typeof data.detail === 'string' && data.detail.length < 1000 &&
      !/\b[A-Z]+(?:_[A-Z]+)+\b|Traceback|Exception|SELECT\s|INSERT\s|[{}\n]/.test(data.detail) ? data.detail : '';
    const message = code === 'DOCUMENT_INTELLIGENCE_DISABLED' ? DOCUMENT_LIBRARY_UNAVAILABLE.description :
      code === 'DOCUMENT_PROCESSING_DISABLED' ? 'La recepción y el procesamiento documental no están habilitados. Puedes seguir consultando los documentos autorizados.' :
      status === 401 ? 'Tu sesión no permite esta consulta. Vuelve a iniciar sesión.' :
      status === 403 ? 'Tu acceso no permite consultar o modificar esta información.' :
      status === 404 ? 'El documento o periodo no está disponible en tu alcance.' :
      detail || 'No fue posible completar la operación documental. Revisa los datos y vuelve a intentar.';
    super(message);
    this.name = 'DocumentLibraryError';
    this.status = status;
    this.code = code;
  }
}

export function libraryUnavailable(error: unknown): boolean {
  return error instanceof DocumentLibraryError && error.code === 'DOCUMENT_INTELLIGENCE_DISABLED';
}

export function documentErrorMessage(error: unknown): string {
  if (error instanceof DocumentLibraryError) return error.message;
  if (error instanceof Error && error.message.length < 1000 &&
      !/CAROVA_DESHABILITADA|\b[A-Z]+(?:_[A-Z]+)+\b|Traceback|Exception|[{}\n]/.test(error.message)) {
    return error.message;
  }
  return 'No fue posible completar la operación documental. Vuelve a intentar.';
}

export async function readDocumentResponse<T>(response: Response): Promise<T> {
  let body: unknown;
  try { body = await response.json(); }
  catch { throw new DocumentLibraryError(response.status, null); }
  if (!response.ok) throw new DocumentLibraryError(response.status, body);
  return body as T;
}
