export class AsyncHelper {
  static async ProcessBatch<T>(arr: T[], callback: (item: T) => Promise<void>, batchSize = 50): Promise<void> {
    let from = 0;
    let to = Math.min(batchSize, arr.length);
    while (from < arr.length) {
      const batch = [];
      for (let i = from; i < to; i++) {
        batch.push(callback(arr[i]));
      }
      await Promise.all(batch);
      from += batchSize;
      to += batchSize;
    }
  }
}
