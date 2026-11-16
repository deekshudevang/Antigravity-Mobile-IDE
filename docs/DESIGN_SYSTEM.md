# Antigravity Remote — Android Design System

Date: 2026-11-16  
Framework: Jetpack Compose (Material 3)  
Guidance: UI/UX Pro Max + Unslop Design Standard  

---

## 1. Visual Direction & Color Tokens

Per Section 9 of the Master Engineering Prompt and Unslop standard:
- **Palette Style**: Dark developer console, precision industrial styling. Zero generic AI clichés (no purple gradients, neon glows, gradient text, emoji badges, or glossy blobs).
- **Surfaces**: Single tinted neutral ramp (charcoal / slate).
- **Accent**: Exactly one primary accent color with WCAG AAA / AA contrast against dark surfaces.

### Semantic Color Palette (M3)
| Token Name | Hex Code | Material 3 Mapping | Purpose |
|---|---|---|---|
| `BgDark` | `#0D1117` | `colorScheme.background` | App background canvas |
| `SurfaceCharcoal` | `#161B22` | `colorScheme.surface` | Cards, app bars, containers |
| `SurfaceElevated` | `#21262D` | `colorScheme.surfaceVariant` | Modals, elevated cards, dropdowns |
| `SurfaceBorder` | `#30363D` | `colorScheme.outline` | Subtle borders, dividers (1dp) |
| `TealAccent` | `#00A389` | `colorScheme.primary` | Active tabs, primary buttons, status online |
| `TealAccentSubtle` | `#00A3891F` | `colorScheme.primaryContainer`| Badge backgrounds, selected row tint |
| `TextPrimary` | `#F0F6FC` | `colorScheme.onBackground` | High-contrast readable headers & body |
| `TextSecondary` | `#8B949E` | `colorScheme.onSurfaceVariant`| Labels, timestamps, secondary metadata |
| `StatusSuccess` | `#2EA043` | `colorScheme.tertiary` | Completed task, valid token, online |
| `StatusWarning` | `#D29922` | `colorScheme.tertiaryContainer`| Disconnected, pending approval |
| `StatusError` | `#F85149` | `colorScheme.error` | Revoked, rate limited, failed command |

---

## 2. Spacing & Grid System (4px / 8dp Rhythm)

Strictly follow a 4dp/8dp mathematical rhythm. No arbitrary pixel values:
| Token | dp Value | Usage |
|---|---|---|
| `spacing_xxs` | `2.dp` | Micro-gap between tag icon and text |
| `spacing_xs` | `4.dp` | Tight padding within badges, chips |
| `spacing_sm` | `8.dp` | Standard gap between list items, button inner padding |
| `spacing_md` | `16.dp`| Card padding, screen horizontal margins |
| `spacing_lg` | `24.dp`| Section separation, dialog padding |
| `spacing_xl` | `32.dp`| Top spacing for empty states, major group dividers |

---

## 3. Typography (Jetpack Compose TypeScale)

Using standard system sans-serif (Roboto) with tabular figures for numbers/timestamps:
| Style | Size / LineHeight | Weight | Tracking | Usage |
|---|---|---|---|---|
| `HeadlineMedium` | 24sp / 30sp | SemiBold (600) | -0.2sp | Screen titles |
| `TitleMedium` | 16sp / 22sp | Medium (500) | 0.sp | Card headers, dialog titles |
| `BodyLarge` | 15sp / 22sp | Normal (400) | 0.sp | Main conversation text |
| `BodyMedium` | 13sp / 18sp | Normal (400) | 0.sp | File explorer list items, details |
| `LabelSmall` | 11sp / 16sp | Medium (500) | 0.4sp | Status badges, timestamps |
| `CodeMonospace` | 13sp / 18sp | Normal (400) | 0.sp | Terminal output, code viewer |

---

## 4. Component Rules & Interaction Standards

1. **Touch Targets**:
   - Every interactive control (icon buttons, tab items, dropdown rows) has a minimum touch target of `48.dp` x `48.dp`, even if the visual icon is 24dp.
2. **Icons**:
   - Consistent single-stroke vector icons (Material Icons Extended).
   - Never use raw emojis (🚀, ✨, ⚙️) as navigation or status icons.
3. **Connection State Indicators**:
   - The Dashboard and Settings must display 4 independent indicators:
     1. Tailscale Status (`VERIFIED` / `UNAVAILABLE` / `UNKNOWN`)
     2. Tailnet Reachability (`REACHABLE` / `UNREACHABLE`)
     3. Bridge Connectivity (`CONNECTED` / `DISCONNECTED`)
     4. Authentication State (`AUTHENTICATED` / `UNAUTHENTICATED`)
4. **Component States**:
   - **Loading**: Subtle indeterminate progress indicator or skeleton placeholders with zero layout shifts.
   - **Empty**: Centered icon, clear title ("No active tasks"), and actionable instruction.
   - **Error**: Distinct card border with error tint (`StatusError`), human-readable error text, and explicit Retry button.
   - **Offline**: Non-blocking status banner at top of screen with last synced timestamp.
