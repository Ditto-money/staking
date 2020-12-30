import { createMuiTheme } from '@material-ui/core/styles';
import { BORDER_RADIUS } from 'config';

export default createMuiTheme({
  typography: {
    fontFamily: '"Rubik", sans-serif',
  },
  palette: {
    type: 'dark',
    background: {
      // default: '',
      // paper: '',
    },
    primary: {
      main: '#ffffff',
    },
    secondary: {
      main: '#ed7ac0',
    },
  },
  overrides: {
    MuiButton: {
      root: {
        borderRadius: BORDER_RADIUS,
      },
    },
    MuiPaper: {
      paper: {
        borderRadius: BORDER_RADIUS,
      },
    },
    MuiDialog: {
      paper: {
        borderRadius: BORDER_RADIUS,
      },
    },
  },
});
