export class AsyncHelper {
    static async ProcessBatch<T>(arr: T[], callback: (item:T) => Promise<void>, batchSize: number = 50 ): Promise<void> {
      let from = 0;
      let to = batchSize;
      while (from < arr.length) {
        const batch = arr.slice(from, to);
        await Promise.all(batch.map(callback));
        from += batchSize;
        to += batchSize;
      }
    }
  }