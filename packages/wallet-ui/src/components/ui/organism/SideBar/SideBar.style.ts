import styled from 'styled-components';
import { AccountImage } from 'components/ui/atom/AccountImage';
import { Button } from 'components/ui/atom/Button';
import { RoundedIcon } from 'components/ui/atom/RoundedIcon';
import { PopIn } from 'components/ui/molecule/PopIn';
import { PopperTooltip } from 'components/ui/molecule/PopperTooltip';

interface IAddTokenButton {
  shadowVisible?: boolean;
}

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${(props) => props.theme.palette.grey.white};
  min-width: 272px;
  border-right: 1px solid ${(props) => props.theme.palette.grey.grey4};
`;

export const AccountLabel = styled.h3`
  font-weight: 900;
  align-self: center;
  margin-top: ${(props) => props.theme.spacing.base};
  margin-bottom: 12px;
`;

export const RowDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-bottom: ${(props) => props.theme.spacing.large};
`;

export const DivList = styled.div``;

export const InfoIcon = styled(RoundedIcon)`
  cursor: pointer;
  margin-right: ${(props) => props.theme.spacing.tiny2};
`;

export const AddTokenButton = styled(Button).attrs((props) => ({
  textStyle: {
    fontWeight: props.theme.typography.bold.fontWeight,
    fontSize: props.theme.typography.c1.fontSize,
    fontFamily: props.theme.typography.bold.fontFamily,
  },
}))<IAddTokenButton>`
  height: 66px;
  justify-content: left;
  padding-left: 20px;
  border-radius: 0px 0px 0px 8px;
  box-shadow: ${(props) => (props.shadowVisible ? '0px -4px 12px -8px rgba(0, 0, 0, 0.25)' : 'initial')};
  margin-top: auto;

  &:hover {
    background-color: ${(props) => props.theme.palette.grey.grey4};
  }
`;

export const AccountImageStyled = styled(AccountImage)`
  margin-left: ${(props) => props.theme.spacing.small};
  margin-top: ${(props) => props.theme.spacing.small};
  cursor: pointer;
`;

export const AccountDetails = styled(PopperTooltip)``;

export const AccountDetailsContent = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0px;
`;

export const AccountDetailButton = styled(Button).attrs((props) => ({
  backgroundTransparent: true,
  fontSize: props.theme.typography.p2.fontSize,
  textStyle: {
    color: props.theme.palette.grey.black,
    fontWeight: props.theme.typography.p2.fontWeight,
    textTransform: 'initial',
  },
}))`
  padding: 0px;
  border-radius: 0px;
  :hover {
    background-color: ${(props) => props.theme.palette.grey.grey4};
  }
`;

export const PopInStyled = styled(PopIn)`
  background-color: transparent;
  .modal-close-button {
    transform: translateY(45px);
  }
`;
