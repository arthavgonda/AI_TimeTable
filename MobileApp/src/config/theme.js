import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2c3e50',
    secondary: '#424242',
    accent: '#2196f3',
    background: '#fafafa',
    surface: '#ffffff',
    text: '#1a1a1a',
    placeholder: '#9e9e9e',
    disabled: '#cccccc',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
};

export const subjectColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16',
  '#A855F7', '#22C55E', '#F472B6', '#6366F1', '#06B6D4'
];

export const getSubjectColor = (subjectCode) => {
  let hash = 0;
  for (let i = 0; i < subjectCode.length; i++) {
    hash = subjectCode.charCodeAt(i) + ((hash << 5) - hash);
  }
  return subjectColors[Math.abs(hash) % subjectColors.length];
};

