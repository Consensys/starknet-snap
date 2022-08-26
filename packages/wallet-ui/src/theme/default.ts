import { DefaultTheme } from 'styled-components';

export const theme: DefaultTheme = {
  palette: {
    grey: {
      black: '#292A6C', //Text primary
      grey1: '#7F80A4', //Text secondary
      grey2: '#A9AAC2',
      grey3: '#D4D4E1',
      grey4: '#F7F7F9', //Background
      white: '#FFFFFF',
    },
    primary: {
      light: '#D4D4E2',
      main: '#292A6C',
      dark: '#212256',
      contrastText: '#FFFFFF',
    },
    secondary: {
      light: '#FFEAE8',
      main: '#FB4C43',
      dark: '#C93D36',
      contrastText: '#FFFFFF',
    },
    error: {
      light: '#FCF2F3',
      main: '#D73A49',
      dark: '#B92534',
      contrastText: '#FFFFFF',
    },
    warning: {
      light: '#FEF5EF',
      main: '#F66A0A',
      dark: '#C65507',
      contrastText: '#FFFFFF',
    },
    info: {
      light: '#EAF6FF',
      main: '#037DD6',
      dark: '#0260A4',
      contrastText: '#FFFFFF',
    },
    success: {
      light: '#CAF4D1',
      main: '#4CD964',
      dark: '#219E37',
      contrastText: '#FFFFFF',
    },
  },
  spacing: {
    none: '0px',
    tiny: '4px',
    tiny2: '8px',
    small: '16px',
    base: '24px',
    medium: '32px',
    large: '40px',
    xLarge: '48px',
    xxLarge: '64px',
  },
  typography: {
    p1: {
      fontFamily: 'Roboto Regular',
      fontWeight: 400,
      fontSize: '16px',
      lineHeight: '22.4px',
    },
    p2: {
      fontFamily: 'Roboto Regular',
      fontWeight: 400,
      fontSize: '14px',
      lineHeight: '19.6px',
    },
    c1: {
      fontFamily: 'Roboto Regular',
      fontWeight: 400,
      fontSize: '12px',
      lineHeight: '16.8px',
    },
    c2: {
      fontFamily: 'Roboto Regular',
      fontWeight: 400,
      fontSize: '10px',
      lineHeight: '14px',
    },
    c3: {
      fontFamily: 'Roboto Regular',
      fontWeight: 400,
      fontSize: '8px',
      lineHeight: '11.2px',
    },
    i1: {
      fontFamily: '"Font Awesome 5 Pro"',
      fontWeight: 400,
      fontSize: '12px',
      lineHeight: '16.8px',
    },
    i2: {
      fontFamily: '"Font Awesome 5 Pro"',
      fontWeight: 400,
      fontSize: '14px',
      lineHeight: '19.6px',
    },
    i3: {
      fontFamily: '"Font Awesome 5 Pro"',
      fontWeight: 400,
      fontSize: '16px',
      lineHeight: '22.4px',
    },
    i4: {
      fontFamily: '"Font Awesome 5 Pro"',
      fontWeight: 400,
      fontSize: '24px',
      lineHeight: '33.6px',
    },
    h1: {
      fontFamily: 'Roboto Bold',
      fontWeight: 700,
      fontSize: '40px',
      lineHeight: '56px',
    },
    h2: {
      fontFamily: 'Roboto Bold',
      fontWeight: 700,
      fontSize: '32px',
      lineHeight: '44.8px',
    },
    h3: {
      fontFamily: 'Roboto Bold',
      fontWeight: 700,
      fontSize: '24px',
      lineHeight: '33.6px',
    },
    h4: {
      fontFamily: 'Roboto Bold',
      fontWeight: 700,
      fontSize: '18px',
      lineHeight: '25.2px',
    },
    bold: {
      fontFamily: 'Roboto Bold',
      fontWeight: 700,
    },
    regular: {
      fontFamily: 'Roboto Regular',
      fontWeight: 400,
    },
  },
  shadow: {
    large: {
      boxShadow: '0px 50px 70px -20px rgba(106, 115, 125, 0.2)',
    },
    menuFixedTop: {
      boxShadow: '0px -4px 12px -8px rgba(0, 0, 0, 0.25)',
    },
    dropDown: {
      boxShadow: '0px 14px 24px -6px rgba(106, 115, 125, 0.2)',
    },
    toolTip: {
      boxShadow: '0px 6px 24px -6px rgba(106, 115, 125, 0.2)',
    },
    dividerBottom: {
      boxShadow: 'inset 0px -1px 0px #F2F4F6',
    },
    dividerTop: {
      boxShadow: 'inset 0px 1px 0px #F2F4F6;',
    },
  },
  corner: {
    none: '0px',
    tiny: '4px',
    small: '8px',
    medium: '16px',
  },
  modal: {
    base: '328px',
    noPadding: '376px',
  },
};
