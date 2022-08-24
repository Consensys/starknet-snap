import { HelperText } from 'components/ui/atom/HelperText';
import { Label } from 'components/ui/atom/Label';
import { InputHTMLAttributes, useRef, useState } from 'react';
import { INPUT_MAX_LENGTH } from 'utils/constants';
import { Icon, Input, InputContainer, Left, RowWrapper, Wrapper } from './InputWithLabel.style';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  helperText?: string;
  label?: string;
  withIcon?: boolean;
  maxLength?: number;
}

export const InputWithLabelView = ({
  disabled,
  error,
  helperText,
  label,
  withIcon,
  maxLength,
  ...otherProps
}: Props) => {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Wrapper>
      <RowWrapper>
        <Label error={error}>{label}</Label>
      </RowWrapper>

      <InputContainer error={error} disabled={disabled} focused={focused} withIcon={withIcon}>
        <Left>
          {withIcon && <Icon icon={error ? ['fas', 'times-circle'] : ['fas', 'check-circle']} error={error} />}
          <Input
            error={error}
            disabled={disabled}
            focused={focused}
            withIcon={withIcon}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            ref={inputRef}
            maxLength={maxLength || INPUT_MAX_LENGTH}
            {...otherProps}
          />
        </Left>
      </InputContainer>
      {helperText && <HelperText>{helperText}</HelperText>}
    </Wrapper>
  );
};
