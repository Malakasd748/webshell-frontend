import type { GlobalThemeOverrides } from 'naive-ui'

const naiveThemeOverride: GlobalThemeOverrides = {
  common: {
    primaryColor: '#3f8cff',
    primaryColorHover: '#579dff',
    textColorDisabled: 'rgba(255, 255, 255, 0.35)',
    borderRadius: '2px',
  },
  Tabs: {
    colorSegment: 'rgba(255, 255, 255, 0.04)',
    tabTextColorHoverSegment: '#3f8cff',
    tabTextColorActiveSegment: '#3f8cff',
    tabColorSegment: 'var(--panel-background-color)',
    tabBorderRadius: 0,
    tabPaddingMediumSegment: '8px 8px',
  },
  Divider: {
    color: 'rgba(255, 255, 255, 0.35)',
  },
  Switch: {
    railColorActive: '#3f8cff',
  },
  Dropdown: {
    color: '#434343',
  },
  Popover: {
    color: '#434343',
  },
  Popselect: {
    color: '#434343',
  },
  Tooltip: {
    color: '#434343',
  },
}

export default naiveThemeOverride
