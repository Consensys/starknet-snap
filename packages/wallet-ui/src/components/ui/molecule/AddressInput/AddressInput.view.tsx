import { KeyboardEvent, ChangeEvent, useEffect } from 'react';
import {
  InputHTMLAttributes,
  useRef,
  useState,
  Dispatch,
  SetStateAction,
} from 'react';
import {
  isSpecialInputKey,
  isValidAddress,
  isValidStarkName,
  shortenAddress,
} from 'utils/utils';
import { HelperText } from 'components/ui/atom/HelperText';
import { Label } from 'components/ui/atom/Label';
import {
  Icon,
  InfoText,
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
  resolvedAddress?: string;
}

export const AddressInputView = ({
  disabled,
  onChange,
  label,
  setIsValidAddress,
  resolvedAddress,
  ...otherProps
}: Props) => {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [valid, setValid] = useState(false);
  const [info, setInfo] = useState('');

  useEffect(() => {
    if (!inputRef.current || !resolvedAddress) {
      return;
    }

    const { valid, error, info } = validateAddress(
      inputRef.current.value,
      resolvedAddress,
    );

    setValid(valid);
    setError(error);
    setInfo(info);
  }, [resolvedAddress]);

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

    const { valid, error, info } = validateAddress(
      inputRef.current.value,
      resolvedAddress,
    );

    setValid(valid);
    setError(error);
    setInfo(info);

    if (setIsValidAddress) {
      setIsValidAddress(valid);
    }
  };

  const validateAddress = (value: string, addr: string | undefined) => {
    if (value !== '' && isValidAddress(value)) {
      return { valid: true, error: '', info: '' };
    } else if (isValidStarkName(value)) {
      if (addr && isValidAddress(addr)) {
        return {
          valid: true,
          error: '',
          info: shortenAddress(addr, 12) as string,
        };
      } else {
        return { valid: false, error: '.stark name not found', info: '' };
      }
    } else {
      return { valid: false, error: 'Invalid address format', info: '' };
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
      {info && <InfoText>{info}</InfoText>}
    </Wrapper>
  );
};
