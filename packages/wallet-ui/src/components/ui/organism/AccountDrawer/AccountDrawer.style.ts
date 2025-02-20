import { Button } from 'components/ui/atom/Button';
import styled from 'styled-components';

export const Drawer = styled(Button).attrs((props) => ({
  fontSize: props.theme.typography.c1.fontSize,
  upperCaseOnly: false,
  textStyle: {
    fontWeight: props.theme.typography.p1.fontWeight,
    fontFamily: props.theme.typography.p1.fontFamily,
  },
  iconStyle: {
    fontSize: props.theme.typography.i1.fontSize,
    color: props.theme.palette.grey.grey1,
  },
}))`
  padding: ${(props) => props.theme.spacing.tiny2};
  height: ${(props) => props.theme.spacing.base};
  color: ${(props) => props.theme.palette.grey.black};
  border-radius: ${(props) => props.theme.corner.medium};
  border: 1px solid ${(props) => props.theme.palette.grey.grey3};

  :hover {
    background-color: ${(props) => props.theme.palette.grey.grey4};
    border: none;
  }
`;
