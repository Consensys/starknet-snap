import { Wrapper } from './Snackbar.style';
import Toastr from 'toastr2';
import 'toastr2/dist/toastr.min.css';
import './snackbar.css';
import { VariantOptions } from 'theme/types';
interface Props {
  text?: string;
  variant?: string;
}

export function SnackbarView({ text, variant }: Props) {
  const snackbar = new Toastr();
  snackbar.options.closeButton = true;
  snackbar.options.closeDuration = 5000;
  snackbar.options.positionClass = 'toast-top-center';

  if (variant === VariantOptions.SUCCESS) {
    snackbar.success(text);
  } else {
    snackbar.error(text);
  }
  return <Wrapper></Wrapper>;
}
