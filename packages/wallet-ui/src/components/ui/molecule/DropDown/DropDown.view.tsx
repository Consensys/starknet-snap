import { DropdownStyled, Wrapper } from './DropDown.style';
import 'react-dropdown/style.css';
import { Group, Option, ReactDropdownProps } from 'react-dropdown';
import { Label } from 'components/ui/atom/Label';
import { HelperText } from 'components/ui/atom/HelperText';
import { useMultiLanguage } from 'services';

interface Props extends ReactDropdownProps {
  error?: boolean;
  options: (string | Group | Option)[];
  helperText?: string;
  label?: string;
  value?: string | Option;
}

export const DropDownView = ({
  disabled,
  error,
  options,
  helperText,
  label,
  value,
  ...otherProps
}: Props) => {
  const { translate } = useMultiLanguage();

  return (
    <Wrapper>
      <Label error={error}>{label}</Label>
      <DropdownStyled
        error={error}
        disabled={disabled}
        options={options}
        value={value}
        placeholder={translate('selectAnOption')}
        {...otherProps}
      />

      {helperText && <HelperText>{helperText}</HelperText>}
    </Wrapper>
  );
};
