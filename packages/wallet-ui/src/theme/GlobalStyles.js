import { createGlobalStyle } from 'styled-components';
import { theme } from './default';
import CheckIcon from 'assets/images/check.png';
import ErrorIcon from 'assets/images/error.png';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    background: ${theme.palette.grey.grey4};
    color: ${theme.palette.grey.black};
    font-family: ${theme.typography.p1.fontFamily} !important;
    font-weight: ${theme.typography.p1.fontWeight};
    font-size: ${theme.typography.p1.fontSize};
    line-height: ${theme.typography.p1.lineHeight};
  }

  h1 {
    font-family: ${theme.typography.h1.fontFamily};
    font-weight: ${theme.typography.h1.fontWeight};
    font-size: ${theme.typography.h1.fontSize};
    line-height: ${theme.typography.h1.lineHeight};
  }

  h2 {
    font-family: ${theme.typography.h2.fontFamily};
    font-weight: ${theme.typography.h2.fontWeight};
    font-size: ${theme.typography.h2.fontSize};
    line-height: ${theme.typography.h2.lineHeight};
  }

  h3 {
    font-family: ${theme.typography.h3.fontFamily};
    font-weight: ${theme.typography.h3.fontWeight};
    font-size: ${theme.typography.h3.fontSize};
    line-height: ${theme.typography.h3.lineHeight};
  }

  h4 {
    font-family: ${theme.typography.h4.fontFamily};
    font-weight: ${theme.typography.h4.fontWeight};
    font-size: ${theme.typography.h4.fontSize};
    line-height: ${theme.typography.h4.lineHeight};
  }


  ::-webkit-scrollbar {
    width: 6px;
  }

  ::-webkit-scrollbar-thumb {
    background-color: ${theme.palette.grey.grey1};
    border-radius: 80px;
  }
  .toast-success {
    background-color: #292a6c;
  }

  #toast-container > .toast-success {
    background-image: url('${CheckIcon}') !important;
  }

  .toast-error {
    background-color: #292a6c;
  }

  #toast-container > .toast-error {
    background-image: url('${ErrorIcon}') !important ;
  }
  .toast-top-center {
    top: 35px !important;
  }
`;

export default GlobalStyle;
