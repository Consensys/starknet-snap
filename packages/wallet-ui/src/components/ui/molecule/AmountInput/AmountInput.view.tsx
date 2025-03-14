import { KeyboardEvent, useEffect } from 'react';
import { InputHTMLAttributes, useRef, useState } from 'react';
import { HelperText } from '../../atom/HelperText';
import { Label } from '../../atom/Label';
import {
  IconRight,
  Input,
  InputContainer,
  Left,
  MaxButton,
  RowWrapper,
  USDDiv,
  Wrapper,
  LoadingWrapper,
} from './AmountInput.style';
import { Erc20TokenBalance } from 'types';
import { ethers } from 'ethers';
import { getAmountPrice, isSpecialInputKey } from 'utils/utils';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  helperText?: string;
  label?: string;
  value?: string;
  decimalsMax?: number;
  asset: Erc20TokenBalance;
  onChangeCustom?: (value: string) => void;
  isEstimatingGas: boolean;
  isMaxAmountPending?: boolean;
  setIsMaxAmountPending?: (value: boolean) => void;
}

export const AmountInputView = ({
  disabled,
  error,
  helperText,
  label,
  value,
  decimalsMax = 18,
  asset,
  onChangeCustom,
  isEstimatingGas,
  isMaxAmountPending = false,
  setIsMaxAmountPending,
  ...otherProps
}: Props) => {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(value || ''); // Manage the input's value
  const [totalPrice, setTotalPrice] = useState('');
  const [usdMode, setUsdMode] = useState(false);

  const triggerOnChange = (newValue: string) => {
    setInputValue(newValue);
    if (onChangeCustom) {
      let valueToSend = newValue;
      if (usdMode && asset.usdPrice && newValue && newValue !== '.') {
        const inputFloat = parseFloat(newValue);
        valueToSend = getAmountPrice(asset, inputFloat, usdMode);
      }
      onChangeCustom(valueToSend);
    }
  };

  useEffect(() => {
    // Adjust the input size whenever the value changes
    if (inputRef.current !== null) {
      inputRef.current.style.width = inputValue.length * 8 + 6 + 'px';
    }
  }, [inputValue]);

  const handleOnKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    //Only accept numeric and decimals
    if (
      (!/[0-9]|\./.test(event.key) ||
        (event.key === '.' && inputValue.includes('.'))) &&
      !isSpecialInputKey(event)
    ) {
      event.preventDefault();
      return;
    }

    //Check decimals
    if (inputValue.includes('.')) {
      const decimalIndex = inputValue.indexOf('.');
      const decimals = inputValue.substring(decimalIndex);
      if (decimals.length >= decimalsMax && !isSpecialInputKey(event)) {
        event.preventDefault();
        return;
      }
    }
  };

  useEffect(
    () => {
      // If isMaxAmountPending is true and the fees are not being fetched,
      // apply the maximum amount and reset isMaxAmountPending to false.
      if (isMaxAmountPending && !isEstimatingGas) {
        handleMaxClick();
        typeof setIsMaxAmountPending === 'function' &&
          setIsMaxAmountPending(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isMaxAmountPending, isEstimatingGas],
  );

  const handleContainerClick = () => {
    if (inputRef.current !== null) {
      inputRef.current.focus();
    }
  };

  const handleMaxClick = () => {
    // If the fees are being fetched, set isMaxAmountPending to true
    // to apply the maximum amount once the fees are fetched.
    if (isEstimatingGas) {
      typeof setIsMaxAmountPending === 'function' &&
        setIsMaxAmountPending(true);
      return;
    }
    let amountBN = ethers.BigNumber.from(asset.amount);
    const amountStr = ethers.utils
      .formatUnits(amountBN, asset.decimals)
      .toString();
    const amountFloat = parseFloat(amountStr);
    const value = usdMode
      ? getAmountPrice(asset, amountFloat, false)
      : amountStr;
    triggerOnChange(value);
  };

  useEffect(() => {
    if (asset.usdPrice && inputValue && inputValue !== '.') {
      const inputFloat = parseFloat(inputValue);
      setTotalPrice(getAmountPrice(asset, inputFloat, usdMode));
    } else {
      setTotalPrice('');
    }
  }, [asset, inputValue, usdMode]);

  return (
    <Wrapper>
      <RowWrapper>
        <Label error={error}>{label}</Label>
        <MaxButton onClick={handleMaxClick}>Max</MaxButton>
      </RowWrapper>

      <InputContainer
        error={error}
        disabled={disabled}
        focused={focused}
        onClick={() => handleContainerClick()}
      >
        <Left>
          <Input
            error={error}
            value={inputValue}
            disabled={disabled}
            focused={focused}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            ref={inputRef}
            onKeyDown={(event) => handleOnKeyDown(event)}
            onChange={(event) => triggerOnChange(event.target.value)}
            {...otherProps}
          />
          {isEstimatingGas && isMaxAmountPending && <LoadingWrapper />}
          {!usdMode && (
            <>
              {asset.symbol}
              <USDDiv> ≈ {totalPrice} USD</USDDiv>
            </>
          )}
          {usdMode && (
            <>
              USD
              <USDDiv>
                ≈ {totalPrice} {asset.symbol}
              </USDDiv>
            </>
          )}
        </Left>
        <IconRight
          icon={['fas', 'exchange-alt']}
          onClick={() => setUsdMode(!usdMode)}
        />
      </InputContainer>
      {helperText && <HelperText>{helperText}</HelperText>}
    </Wrapper>
  );
};
