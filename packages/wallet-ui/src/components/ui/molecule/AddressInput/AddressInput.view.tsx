import { KeyboardEvent, ChangeEvent, useEffect } from 'react';
import {
  InputHTMLAttributes,
  useRef,
  useState,
  Dispatch,
  SetStateAction,
} from 'react';
import { isSpecialInputKey, isValidAddress } from 'utils/utils';
import { HelperText } from 'components/ui/atom/HelperText';
import { Label } from 'components/ui/atom/Label';
import {
  Icon,
  Input,
  InputContainer,
  Left,
  RowWrapper,
  Wrapper,
} from './AddressInput.style';
import { STARKNET_ADDRESS_LENGTH } from 'utils/constants';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  setIsValidAddress?: Dispatch<SetStateAction<boolean>>;
  disableValidate?: boolean;
  validateError?: string;
}

export const AddressInputView = ({
  disabled,
  onChange,
  label,
  setIsValidAddress,
  disableValidate,
  validateError,
  ...otherProps
}: Props) => {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [valid, setValid] = useState(false);
  useEffect(() => {
    if (!disableValidate || !inputRef.current) return;
    setValid(inputRef.current.value !== '' && validateError === '');
    setError(validateError ?? '');
  }, [disableValidate, validateError]);

  const displayIcon = () => {
    return valid || error !== '';
  };

  const handleOnKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (
      inputRef.current &&
      inputRef.current.value.length >= STARKNET_ADDRESS_LENGTH &&
      !isSpecialInputKey(event)
    ) {
      event.preventDefault();
    }
  };

  const handleOnChange = (event: ChangeEvent<HTMLInputElement>) => {
    //Check if valid address
    onChange && onChange(event);

    if (!inputRef.current) return;

    if (disableValidate) return;

    const isValid =
      inputRef.current.value !== '' && isValidAddress(inputRef.current.value);
    if (isValid) {
      setValid(true);
      setError('');
    } else {
      setValid(false);
      setError('Invalid address format');
    }

    if (setIsValidAddress) {
      setIsValidAddress(isValid);
    }
  };

  return (
    <Wrapper>
      <RowWrapper>
        <Label error={!!error}>{label}</Label>
      </RowWrapper>

      <InputContainer
        error={!!error}
        disabled={disabled}
        focused={focused}
        withIcon={displayIcon()}
      >
        <Left>
          {displayIcon() && (
            <Icon
              icon={error ? ['fas', 'times-circle'] : ['fas', 'check-circle']}
              error={error}
            />
          )}
          <Input
            error={!!error}
            disabled={disabled}
            focused={focused}
            withIcon={displayIcon()}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            ref={inputRef}
            onKeyDown={(event) => handleOnKeyDown(event)}
            onChange={(event) => handleOnChange(event)}
            {...otherProps}
          />
        </Left>
      </InputContainer>
      {error && <HelperText>{error}</HelperText>}
    </Wrapper>
  );
};
