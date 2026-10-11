export type IconName =
  | 'security'
  | 'income'
  | 'expense'
  | 'saving'
  | 'investment'
  | 'transfer'
  | 'budget'
  | 'wallet'
  | 'transactions'
  | 'categories'
  | 'trash'
  | 'edit'
  | 'plus'
  | 'database'
  | 'report'
  | 'report-live'
  | 'user'
  | 'users'
  | 'users-seen'
  | 'presence'
  | 'connected'
  | 'settings'
  | 'activity-log'
  | 'calendar'
  | 'note'
  | 'admin'
  | 'github'
  | 'globe'
  | 'mail'
  | 'password'
  | 'show-password'
  | 'hide-password'
  | 'eye'
  | 'search'
  | 'menu'
  | 'close'
  | 'expand'
  | 'collapse'
  | 'proceed'
  | 'logout'
  | 'check'
  | 'info'
  | 'warning'
  | 'error'
  | 'external-link'
  | 'theme-light'
  | 'theme-dark'
  | 'theme-system'
  | 'save'
  | 'linkedin'
  | 'loading'
  | 'chevron-up'
  | 'chevron-down'
  | 'paperclip'
  | 'file'
  | 'maximize'
  | 'minimize'
  | 'download';

export type AppIconTag = 'path' | 'circle' | 'rect' | 'line' | 'polyline' | 'polygon' | 'ellipse';

export interface AppIconNode {
  readonly tag: AppIconTag;
  readonly attrs: Readonly<Record<string, string>>;
}

export interface AppIconData {
  readonly viewBox: string;
  readonly nodes: readonly AppIconNode[];
}
