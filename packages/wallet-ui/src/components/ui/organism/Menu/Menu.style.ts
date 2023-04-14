import styled from 'styled-components';
import { Button } from 'components/ui/atom/Button';
import { RoundedIcon } from 'components/ui/atom/RoundedIcon';
import { Menu } from '@headlessui/react';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding-top: 26px;
  padding-bottom: 26px;
  a {
    all: unset;
  }
`;

export const Left = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  img {
    transform: translateX(-3px);
  }
`;

export const Right = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
`;

export const NetworkPill = styled(Button).attrs((props) => ({
  fontSize: props.theme.typography.p2.fontSize,
  upperCaseOnly: false,
  textStyle: {
    fontWeight: props.theme.typography.p2.fontWeight,
  },
  iconStyle: {
    fontSize: props.theme.typography.i1.fontSize,
    color: props.theme.palette.grey.grey1,
  },
}))`
  padding: 8px 16px;
  height: 40px;
  color: ${(props) => props.theme.palette.grey.grey1};
  border-radius: 80px;
  border: 1px solid ${(props) => props.theme.palette.grey.white};
  gap: ${(props) => props.theme.spacing.tiny2};
`;

export const MenuIcon = styled(RoundedIcon).attrs(() => ({}))`
  height: 40px;
  width: 40px;
  position: relative;
  color: ${(props) => props.theme.palette.grey.grey1};
  border-radius: 80px;
  border: 1px solid ${(props) => props.theme.palette.grey.white};
  &:hover {
    background-color: ${(props) => props.theme.palette.grey.white};
  }
`;

export const Badge = styled.div.attrs(() => ({}))`
  box-sizing: border-box;
  position: absolute;
  width: 12px;
  height: 12px;
  left: 30px;
  top: 0px;
  border-radius: 50%;
`;

export const MenuSection = styled.div`
  padding: 0px 10px;
  display: flex;
  flex-direction: column;
`;

export const MenuItems = styled(Menu.Items)`
  position: absolute;
  right: 0;
  margin-top: 0.5rem;
  background: #ffffff;
  box-shadow: 0px 14px 24px -6px rgba(106, 115, 125, 0.2);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  padding: 8px 0px;
  gap: 8px;
  width: 280px;
`;

export const MenuDivider = styled(Menu.Items)`
  width: 280px;
  height: 1px;
  background: #d4d4e1;
`;

export const Bold = styled.div`
  font-size: ${(props) => props.theme.typography.p1.fontSize};
  font-weight: 900;
`;

export const MenuItemText = styled.span`
  ${(props) => props.theme.typography.p2};
`;

export const NetworkMenuItem = styled.div`
  cursor: pointer;
`;
