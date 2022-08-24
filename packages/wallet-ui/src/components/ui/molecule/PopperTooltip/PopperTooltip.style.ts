import styled from 'styled-components';

interface IDiv {
  arrowVisible?: boolean;
}

export const Wrapper = styled.div`
  width: fit-content;
`;

export const PopperContainer = styled.div<IDiv>`
  border-radius: ${(props) => props.theme.corner.small};
  background-color: ${(props) => props.theme.palette.grey.white};
  padding: ${(props) => props.theme.spacing.small};
  text-align: center;
  box-shadow: 0px 0px 60px 0px rgba(106, 115, 125, 0.2);

  .arrow {
    position: absolute;
    width: 20px;
    height: 20px;

    &:after {
      content: ' ';
      position: absolute;
      top: -27px; // we account for the PopperContainer padding
      left: 0px;
      transform: rotate(45deg);
      width: 20px;
      height: 20px;
      background-color: white;
    }
  }

  &[data-popper-placement^='top'] > .arrow {
    bottom: -37px;
  }

  &[data-popper-placement^='right'] > .arrow {
    &:after {
      left: -27px;
      top: calc(50% - 10px);
    }
  }

  &[data-popper-placement^='left'] > .arrow {
    right: 0px;
    &:after {
      top: calc(50% - 10px);
    }
  }
`;

export const ToolTipContent = styled.div`
  font-size: ${(props) => props.theme.typography.c1.fontSize};
  color: ${(props) => props.theme.palette.grey.grey1};
`;
