import { useAppSelector } from 'hooks/redux';

export const useMultiLanguage = () => {
  const { locale } = useAppSelector((state) => state.wallet);

  const translate = (key: string, ...args: (string | undefined)[]): string => {
    const template = locale[key]?.message ?? `{${key}}`;

    return template.replace(/\{(\d+)\}/g, (_, index: string) => {
      const argIndex = parseInt(index, 10) - 1;
      return args[argIndex] ?? `{${index}}`;
    });
  };

  return {
    translate,
  };
};
