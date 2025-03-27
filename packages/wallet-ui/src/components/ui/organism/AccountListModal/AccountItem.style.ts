import styled from 'styled-components';
import { AccountImage } from 'components/ui/atom/AccountImage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { MenuItem as MuiMenuItem } from '@mui/material';

export const Wrapper = styled.div<{ selected: boolean; visible: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  opacity: ${(props) => (props.visible ? 1 : 0.5)};
  background-color: ${(props) =>
    props.selected ? props.theme.palette.grey.grey4 : 'transparent'};
  border-left: ${(props) =>
    props.selected
      ? `${props.theme.spacing.tiny} solid ${props.theme.palette.secondary.main}`
      : `${props.theme.spacing.tiny} solid ${props.theme.palette.secondary.contrastText}`};
  padding: ${(props) => props.theme.spacing.small};
  cursor: pointer;
`;

export const AccountInfoWrapper = styled.div`
  display: flex;
  align-items: center;
`;

export const AccountImageStyled = styled(AccountImage)`
  cursor: pointer;
`;

export const VisibilityIcon = styled(FontAwesomeIcon)`
  font-size: ${(props) => props.theme.typography.p2.fontSize};
  color: ${(props) => props.theme.palette.grey.grey2};
`;

export const AccountItemWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${(props) => props.theme.spacing.small};
  border-bottom: 1px solid ${(props) => props.theme.palette.grey.grey3};
`;

export const AccountDetailsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding-left: ${(props) => props.theme.spacing.small};
`;

export const AccountName = styled.div`
  font-size: ${(props) => props.theme.typography.p1.fontSize};
  font-weight: bold;
`;

export const AccountAddress = styled.div`
  font-size: ${(props) => props.theme.typography.p2.fontSize};
  color: ${(props) => props.theme.palette.grey.grey1};
`;

export const AccountActions = styled.div`
  display: flex;
  align-items: center;
  position: relative;
`;

export const VerticalDotsIcon = styled(FontAwesomeIcon).attrs({
  icon: 'ellipsis-v',
})`
  cursor: pointer;
  font-size: ${(props) => props.theme.typography.p2.fontSize};
  color: ${(props) => props.theme.palette.grey.grey2};
`;

export const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background-color: ${(props) => props.theme.palette.grey.white};
  border: 1px solid ${(props) => props.theme.palette.grey.grey3};
  border-radius: 4px;
  z-index: 10;
`;

export const DropdownItem = styled.div`
  padding: ${(props) => props.theme.spacing.small};
  cursor: pointer;
  &:hover {
    background-color: ${(props) => props.theme.palette.grey.grey2};
  }
`;

export const MenuItem = styled(MuiMenuItem)`
  display: flex;
  align-items: center;
  justify-content: flex-start; /* Aligne les éléments à gauche */
  gap: ${(props) =>
    props.theme.spacing.small}; /* Espacement entre l'icône et le texte */
  padding: ${(props) => props.theme.spacing.small};
  font-size: ${(props) => props.theme.typography.p2.fontSize};

  & > svg {
    flex-shrink: 0; /* Empêche l'icône de se redimensionner */
    min-width: 30px;
  }

  & > span {
    flex-grow: 1; /* Permet au texte de prendre l'espace restant */
    text-align: left; /* Aligne le texte à gauche */
    font-size: ${(props) => props.theme.typography.p2.fontSize};
  }
`;
