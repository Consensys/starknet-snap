import { CornerIcon, Wrapper, IconPlaceHolder } from './DoubleIcons.style';

interface Props {
  icon1: string;
  icon2: string;
  iconSize?: string;
  cornerIconSize?: string;
  tokenName?: string;
}

export const DoubleIconsView = ({ tokenName, icon1, icon2, iconSize = '24px', cornerIconSize = '10px' }: Props) => {
  return (
    <Wrapper iconBackground={icon1} size={iconSize}>
      {!icon1 && tokenName && (
        <IconPlaceHolder>{tokenName.charAt(0) + tokenName.charAt(tokenName.length - 1)}</IconPlaceHolder>
      )}
      <CornerIcon src={icon2} alt={icon2} size={cornerIconSize} />
    </Wrapper>
  );
};
