import { Logo, LogoVariant } from 'components/ui/atom/Logo';
import {
  Content,
  Title,
  Wrapper,
  ButtonWrapper,
  StyledButton,
} from './Modal.style';

export interface ChildrenProps {
  children?: React.ReactNode;
}

export interface Props extends ChildrenProps {
  title?: string;
}

export interface BodyProps extends ChildrenProps {
  align?: 'center' | 'left' | 'right';
}

export interface ButtonProps extends ChildrenProps {
  onClick?: (event: React.MouseEvent) => void | Promise<void>;
}

export const ModalView = ({ children }: ChildrenProps) => {
  return <Wrapper>{children}</Wrapper>;
};

ModalView.Title = (props: ChildrenProps) => <Title>{props.children}</Title>;

ModalView.Logo = () => (
  <Logo variant={LogoVariant.Starknet} mb="medium" mt="medium" />
);

ModalView.Body = (props: BodyProps) => (
  <Content align={props.align}>{props.children}</Content>
);

ModalView.Buttons = ({ children }: ChildrenProps) => {
  return <ButtonWrapper>{children}</ButtonWrapper>;
};

ModalView.Button = ({ children, onClick }: ButtonProps) => {
  return (
    <StyledButton
      onClick={onClick}
      customIconLeft={<Logo variant={LogoVariant.MetaMask} mr="tiny2" />}
    >
      {children}
    </StyledButton>
  );
};
