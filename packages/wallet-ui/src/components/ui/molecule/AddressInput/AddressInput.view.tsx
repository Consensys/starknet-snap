import { KeyboardEvent, ChangeEvent } from 'react';
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
import { useStarkNetSnap } from 'services';
import { useAppSelector } from 'hooks/redux';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  setIsValidAddress?: Dispatch<SetStateAction<boolean>>;
  onResolvedAddress?: (address: string) => void;
}

export const AddressInputView = ({
  disabled,
  onChange,
  label,
  setIsValidAddress,
  onResolvedAddress,
  ...otherProps
}: Props) => {
  const networks = useAppSelector((state) => state.networks);
  const chainId = networks?.items[networks.activeNetwork]?.chainId;
  const { getAddrFromStarkName } = useStarkNetSnap();
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [valid, setValid] = useState(false);
  const [info, setInfo] = useState('');

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

    if (!inputRef.current) {
      return;
    }
    const isValid =
      inputRef.current.value !== '' && isValidAddress(inputRef.current.value);
    if (isValid) {
      setValid(true);
      setError('');
      onResolvedAddress?.(inputRef.current.value);
    } else if (isValidStarkName(inputRef.current.value)) {
      setValid(false);
      setError('');

      getAddrFromStarkName(inputRef.current.value, chainId).then((address) => {
        if (isValidAddress(address)) {
          setValid(true);
          setError('');
          setInfo(shortenAddress(address as string, 12) as string);
          onResolvedAddress?.(address as string);
        } else {
          setValid(false);
          setError('.stark name not found');
          setInfo('');
        }
      });
    } else {
      setValid(false);
      setError('Invalid address format');
      setInfo('');
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
      {info && <InfoText>{info}</InfoText>}
    </Wrapper>
  );
};
