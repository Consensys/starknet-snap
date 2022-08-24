import { ThemeProvider } from 'styled-components';
import { theme } from '../src/theme/default';
import GlobalStyle from '../src/theme/GlobalStyles';
import { library } from '@fortawesome/fontawesome-svg-core';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { store } from '../src/store/store';
import { Provider } from 'react-redux';
import '../src/App.css';
import { MockedState } from './MockedState';

library.add(fas, far);

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};

export const decorators = [
  (Story) => {
    return (
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <MockedState />
          <GlobalStyle />
          <Story />
        </ThemeProvider>
      </Provider>
    );
  },
];
