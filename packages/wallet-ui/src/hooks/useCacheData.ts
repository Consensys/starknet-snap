import { useAppDispatch, useAppSelector } from './redux';
import { setCacheData, clearCache } from 'slices/cacheSlice';

export const useCacheData = <Data>({
  cacheKey,
  cacheDurtion,
}: {
  cacheKey: string;
  cacheDurtion: number;
}) => {
  const dispatch = useAppDispatch();
  const cacheData = useAppSelector((state) => state.cache.cacheData);

  const hasCache = Object.prototype.hasOwnProperty.call(cacheData, cacheKey);

  const saveCache = (data: Data) => {
    dispatch(
      setCacheData({
        key: cacheKey,
        data,
        expiredAt: Date.now() + cacheDurtion,
      }),
    );
  };

  const deleteCache = () => {
    dispatch(
      clearCache({
        key: cacheKey,
      }),
    );
  };

  return {
    expired: hasCache ? cacheData[cacheKey]?.expiredAt < Date.now() : false,
    cacheData: cacheData[cacheKey]?.data as Data,
    saveCache,
    deleteCache,
  };
};
