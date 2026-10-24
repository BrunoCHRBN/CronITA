# CronITA

[English](README.en.md) · [Português](README.md)

Web and desktop application for study session time tracking and curriculum management tailored to the Instituto Tecnológico de Aeronáutica (ITA) entrance examination.

Engineered with an emphasis on contrast, visual ergonomics, and low cognitive overhead. Free of prefabricated UI component kits, decorative gradient fills, or translucent blur effects that degrade readability and performance.

---

## Features

### 1. Dual Timer Engine
- **Freeform Mode**: Linear elapsed-time stopwatch for continuous sessions.
- **Pomodoro Mode**: Configurable intervals for focus blocks, short breaks, and long breaks (default: 50 min focus, 10 min short break, 25 min long break every 3 blocks). Phase transitions are accompanied by synthesized chimes (Web Audio API) and system notifications.

### 2. ITA Examination Syllabus
- Structured taxonomy covering all 6 test subjects: Mathematics, Physics, Chemistry, Portuguese, English, and Essay Writing.
- 68 official syllabus topics with persistent tracking of cumulative studied time and itemized completion flags.
- Custom dropdowns featuring integrated search filters for rapid topic selection across dense listings.

### 3. Study Load Distribution
- Segmented proportional progress bar on the subjects view showing relative percentage of total study time spent per discipline, preventing neglect of threshold-evaluated topics.

### 4. Zen Focus Mode (<kbd>F</kbd>)
- Strips out sidebars, secondary stat cards, and numeric tables, keeping only the dial and essential controls in full view.

### 5. Command Palette (<kbd>Ctrl+K</kbd> / <kbd>/</kbd>)
- Keyboard-driven modal search to navigate screens and subjects without manual pointer interaction.

### 6. Active Session Guards
- **Screen Wake Lock**: Prevents screen sleep while the timer is actively running without requiring mouse or keyboard input.
- **Closure Prevention**: Hooks `beforeunload` to intercept accidental browser tab closure during live sessions.
- **System Notifications**: Fires OS-level notifications on interval completion when the window is hidden or minimized.

### 7. Storage and Data Portability
- Persisted locally using `localStorage` (`cronita:v1`).
- Complete JSON data export and import for offline backups and migration between machines.

---

## Technology Stack

- **Runtime & UI**: React 19, TypeScript
- **Bundler**: Vite
- **Iconography**: Lucide React
- **Browser APIs**: Web Audio API, Notifications API, Screen Wake Lock API
- **Styling**: Vanilla CSS organized via design tokens (no CSS-in-JS, preprocessors, or utility frameworks)

---

## Repository Structure

```text
CronITA/
├── public/
│   ├── icon.svg
│   └── manifest.webmanifest
├── src/
│   ├── components/
│   │   ├── AppShell.tsx        # Responsive layout and primary navigation
│   │   ├── CommandPalette.tsx  # Global modal search palette (Ctrl+K)
│   │   ├── CustomSelect.tsx    # Curved select menu with search and auto-flip
│   │   ├── Dialog.tsx          # Accessible native HTML dialog wrapper
│   │   ├── SubjectsScreen.tsx  # Topic checklist and distribution metrics
│   │   ├── TimerRing.tsx       # 60-tick SVG watch face
│   │   ├── TimerScreen.tsx     # Primary timer dial, controls, and settings
│   │   └── Toast.tsx           # Inline contextual alerts
│   ├── lib/
│   │   ├── hooks.ts            # Utility hooks for routes and intervals
│   │   ├── sound.ts            # Audio synthesis with Web Audio API
│   │   ├── stats.ts            # Time aggregation and syllabus analytics
│   │   ├── store.tsx           # Reducer state management with localStorage
│   │   ├── subjects.ts         # ITA subject database and topics
│   │   └── time.ts             # Time formatters and duration helpers
│   ├── styles/
│   │   ├── app.css             # Component layouts and transition styles
│   │   └── tokens.css          # Color scheme, typography, radii, and spacing
│   ├── App.tsx                 # Root component and lifecycle handlers
│   └── main.tsx                # Client entrypoint
├── index.html
├── package.json
└── vite.config.ts
```

---

## Local Installation and Execution

### Requirements
- Node.js (version 20 or higher)
- `pnpm` package manager (or `npm` / `yarn`)

### Commands

```bash
# 1. Clone the repository
git clone https://github.com/BrunoCHRBN/CronITA.git
cd CronITA

# 2. Install dependencies
pnpm install

# 3. Start development server
pnpm dev --port 5180

# 4. Generate production build
pnpm build

# 5. Preview production build locally
pnpm preview --port 5180
```

---

## Global Keyboard Shortcuts

| Shortcut | Scope | Behavior |
| :--- | :--- | :--- |
| <kbd>Space</kbd> | Timer screen | Toggle start / pause |
| <kbd>Enter</kbd> | Timer screen | Complete and record study block |
| <kbd>F</kbd> | Global | Toggle Zen Focus Mode |
| <kbd>P</kbd> | Timer screen (idle) | Switch between Freeform and Pomodoro |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> or <kbd>/</kbd> | Global | Open command palette and topic search |
| <kbd>Esc</kbd> | Modals / Zen / Menus | Close active dialog or exit Zen Mode |

---

## Backup Data Format (JSON)

Exported files conform to the following schema:

```json
{
  "version": 1,
  "sessions": [
    {
      "id": "s_1729800000000_abc",
      "subjectId": "matematica",
      "topicId": "matematica:conicas",
      "startedAt": 1729800000000,
      "endedAt": 1729803000000,
      "durationMs": 3000000,
      "mode": "pomodoro"
    }
  ],
  "completedTopicIds": [
    "matematica:conicas"
  ],
  "settings": {
    "focusMin": 50,
    "shortBreakMin": 10,
    "longBreakMin": 25,
    "longBreakEvery": 3,
    "dailyGoalHours": 6,
    "sound": true
  },
  "theme": "system"
}
```

---

## Linux Desktop Integration (Wayland / Hyprland)

To run CronITA as a chromeless desktop application window:

```bash
# Launcher script
~/.local/bin/cronita

# Desktop entry
~/.local/share/applications/cronita.desktop
```

For Hyprland window rules, source the provided config in `hyprland.conf`:
```ini
source = ~/.config/hypr/cronita.conf
```
Default shortcut: <kbd>Super</kbd> + <kbd>Shift</kbd> + <kbd>C</kbd>.

---

## License

Released under the MIT License. See [LICENSE](LICENSE) for details.
