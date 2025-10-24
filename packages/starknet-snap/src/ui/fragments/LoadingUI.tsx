import {
  Heading,
  Box,
  Spinner,
  type SnapComponent,
} from '@metamask/snaps-sdk/jsx';

/**
 * Builds a loading UI component.
 *
 * @returns A loading component.
 */
export const LoadingUI: SnapComponent = () => {
  return (
    <Box alignment="space-between" center={true}>
      <Heading>please wait...</Heading>
      <Spinner />
    </Box>
  );
};
