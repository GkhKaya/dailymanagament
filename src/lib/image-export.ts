export type ImageDeliveryResult = 'shared' | 'downloaded' | 'cancelled';

export async function deliverImageFile<T>(
  file: T,
  actions: {
    canShareFiles: (files: T[]) => boolean;
    shareFiles: (files: T[]) => Promise<void>;
    downloadFile: (file: T) => void;
  },
): Promise<ImageDeliveryResult> {
  if (actions.canShareFiles([file])) {
    try {
      await actions.shareFiles([file]);
      return 'shared';
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return 'cancelled';
    }
  }

  actions.downloadFile(file);
  return 'downloaded';
}
