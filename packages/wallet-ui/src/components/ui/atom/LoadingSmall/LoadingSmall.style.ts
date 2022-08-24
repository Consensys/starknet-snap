import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

export const Wrapper = styled.div`
  background-color: ${(props) => props.theme.palette.grey.white};
  color: ${(props) => props.theme.palette.secondary.main};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing.tiny};
`;

export const LoadingText = styled.div`
  font-size: ${(props) => props.theme.typography.p2.fontSize};
  font-weight: 900;
`;

export const LoadingSpinner = styled(FontAwesomeIcon)``;
