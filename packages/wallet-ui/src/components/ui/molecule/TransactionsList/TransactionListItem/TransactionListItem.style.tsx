import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';
import { theme } from 'theme/default';
import { RoundedIcon } from 'components/ui/atom/RoundedIcon';
import {
  TransactionExecutionStatus,
  TransactionFinalityStatus,
} from 'starknet';

interface ISpan {
  status?: string;
}

interface IIconeStyled {
  transactionname?: string;
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case TransactionFinalityStatus.ACCEPTED_ON_L1:
    case TransactionFinalityStatus.ACCEPTED_ON_L2:
    case TransactionExecutionStatus.SUCCEEDED:
      return theme.palette.success.dark;
    case TransactionFinalityStatus.RECEIVED:
      return theme.palette.info.main;
    case TransactionFinalityStatus.NOT_RECEIVED:
    case TransactionExecutionStatus.REJECTED:
    case TransactionExecutionStatus.REVERTED:
      return theme.palette.error.main;
    default:
      return theme.palette.grey.grey1;
  }
};

export const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  box-shadow: ${(props) => props.theme.shadow.dividerBottom.boxShadow};
  background: ${(props) => props.theme.palette.grey.white};
  padding: ${(props) => props.theme.spacing.base};
  padding-top: ${(props) => props.theme.spacing.small};
  padding-bottom: ${(props) => props.theme.spacing.small};
  align-items: center;
  &:hover {
    background-color: ${(props) => props.theme.palette.grey.grey4};
  }
  cursor: pointer;
`;

export const Column = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: ${(props) => props.theme.spacing.small};
`;

export const LeftIcon = styled(RoundedIcon)`
  height: 32px;
  width: 32px;
`;

export const IconStyled = styled(FontAwesomeIcon)<IIconeStyled>`
  font-size: ${(props) => props.theme.typography.i2.fontSize};
  color: ${(props) => props.theme.palette.grey.grey1};
  transform: ${(props) =>
    props.transactionname === 'Send' ? 'rotate(45deg)' : 'initial'};
`;

export const Label = styled.span`
  font-size: ${(props) => props.theme.typography.p1.fontSize};
  font-weight: ${(props) => props.theme.typography.bold.fontWeight};
  font-family: ${(props) => props.theme.typography.bold.fontFamily};
`;

export const Description = styled.span`
  font-size: ${(props) => props.theme.typography.p2.fontSize};
  color: ${(props) => props.theme.palette.grey.grey1};
`;

export const Status = styled.span<ISpan>`
  color: ${(props) => getStatusColor(props.status)};
`;

export const Left = styled.div`
  flex: 2;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

export const Middle = styled.div`
  font-size: ${(props) => props.theme.typography.p2.fontSize};
  color: ${(props) => props.theme.palette.grey.grey1};
  flex: 2;
  text-align: center;
`;

export const Right = styled.div`
  flex: 1;
  text-align: end;
`;
