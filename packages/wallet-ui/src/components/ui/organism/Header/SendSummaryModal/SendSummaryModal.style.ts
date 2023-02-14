import styled from 'styled-components';
import { Button } from 'components/ui/atom/Button';
import { LoadingSmall } from 'components/ui/atom/LoadingSmall';
import { Alert } from 'components/ui/atom/Alert';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${(props) => props.theme.palette.grey.white};
  width: ${(props) => props.theme.modal.base};
  padding: ${(props) => props.theme.spacing.base};
  border-radius: 8px 8px 0px 0px;
`;

export const Header = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
`;

export const Title = styled.div`
  font-size: ${(props) => props.theme.typography.h3.fontSize};
  font-weight: ${(props) => props.theme.typography.h3.fontWeight};
  font-family: ${(props) => props.theme.typography.h3.fontFamily};
  width: 100%;
  text-align: center;
`;

export const ToDiv = styled.div`
  font-size: ${(props) => props.theme.typography.p2.fontSize};
  font-weight: 900;
`;

export const AddressDiv = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 6px;
  height: 50px;
  color: ${(props) => props.theme.palette.grey.grey1};
  font-size: ${(props) => props.theme.typography.p2.fontSize};
  border: 1px dashed ${(props) => props.theme.palette.grey.grey3};
  border-radius: 6px;
  margin-bottom: ${(props) => props.theme.spacing.medium};
`;

export const Summary = styled.div`
  margin-top: ${(props) => props.theme.spacing.medium};
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

export const LeftSummary = styled.div`
  flex: 1;
`;

export const RightSummary = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  align-items: flex-end;
`;

export const LoadingWrapper = styled(LoadingSmall)`
  width: 137px;
  height: 70px;
`;

export const CurrencyAmount = styled.div`
  font-size: ${(props) => props.theme.typography.p1.fontSize};
  text-align: end;
`;

export const USDAmount = styled.div`
  font-size: ${(props) => props.theme.typography.p2.fontSize};
  color: ${(props) => props.theme.palette.grey.grey1};
`;

export const TotalAmount = styled.div`
  margin-top: ${(props) => props.theme.spacing.tiny2};
  font-size: ${(props) => props.theme.typography.c1.fontSize};
  color: ${(props) => props.theme.palette.grey.grey1};
  align-self: flex-end;
`;

export const IncludeDeploy = styled.div`
  margin-top: ${(props) => props.theme.spacing.tiny2};
  font-size: ${(props) => props.theme.typography.c1.fontSize};
  color: ${(props) => props.theme.palette.grey.grey1};
  align-self: flex-end;
`;

export const Buttons = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  width: ${(props) => props.theme.modal.base};
  background-color: ${(props) => props.theme.palette.grey.white};
  border-radius: 0px 0px 8px 8px;
  box-shadow: inset 0px 1px 0px rgba(212, 212, 225, 0.4);
`;

export const ButtonStyled = styled(Button)`
  width: 152px;
`;

export const EstimatedFeesTooltip = styled.div`
  width: 240px;
  text-align: left;
`;

export const AlertTotalExceedsAmount = styled(Alert)`
  margin-top: ${(props) => props.theme.spacing.base};
`;
