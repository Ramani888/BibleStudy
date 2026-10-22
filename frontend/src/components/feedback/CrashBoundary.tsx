import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../theme';
import { recordError } from '../../lib/crashlytics';
import { ErrorState } from './ErrorState';

interface CrashBoundaryProps {
  children: ReactNode;
}

interface CrashBoundaryState {
  hasError: boolean;
}

// A screen that throws while rendering would otherwise leave a blank app. This catches
// it, reports it to Crashlytics, and shows a retry screen that re-mounts the tree.
// Class component on purpose: React only supports error boundaries as classes.
export class CrashBoundary extends Component<CrashBoundaryProps, CrashBoundaryState> {
  state: CrashBoundaryState = { hasError: false };

  static getDerivedStateFromError(): CrashBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    recordError(error, `render crash${info.componentStack ? `:${info.componentStack.slice(0, 900)}` : ''}`);
  }

  private retry = () => this.setState({ hasError: false });

  render() {
    return this.state.hasError ? <CrashFallback onRetry={this.retry} /> : this.props.children;
  }
}

function CrashFallback({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation('common');
  const { qm } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: qm.bg }]}>
      <ErrorState message={t('common:status.crashed')} onRetry={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
