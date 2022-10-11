import styled from 'styled-components';
import { theme } from 'theme/default';
import { Variant } from 'theme/types';

interface Idiv {
  variant: Variant;
  isMultiline: boolean;
}

export const Wrapper = styled.div<Idiv>`
  display: flex;
  align-items: ${(props) => (props.isMultiline ? 'flex-start' : 'center')};
  background-color: ${(props) => {
    switch (props.variant) {
      case 'success':
        return theme.palette.success.light;

      case 'error':
        return theme.palette.error.light;

      case 'info':
        return theme.palette.info.light;

      case 'warning':
        return theme.palette.warning.light;

      default:
        break;
    }
  }};
  border-radius: 4px;
  width: 90%;
  padding: 0rem 0.75rem;
  color: ${(props) => {
    switch (props.variant) {
      case 'success':
        return theme.palette.success.dark;

      case 'error':
        return theme.palette.error.main;

      case 'info':
        return theme.palette.info.dark;

      case 'warning':
        return theme.palette.warning.main;

      default:
        break;
    }
  }};
  margin: 0rem auto;
  padding-top: 12px;
  padding-bottom: 12px;
`;

export const Parag = styled.p`
  margin-left: 1rem;
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
  line-height: 140%;
  margin-top: 0;
  margin-bottom: 0;
  text-align: left;
`;
