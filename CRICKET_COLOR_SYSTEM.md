# 🏏 Cricket Scoreboard Color System

## Overview

The application now follows a professional cricket scoreboard-inspired color system for instant readability, emotional clarity, and authentic sports aesthetics.

---

## 🎨 Color Palette

### 1️⃣ PRIMARY BRAND COLORS

#### **Royal Blue** - Primary Background
```css
HSL: 225, 73%, 57%
RGB: 65, 105, 225
HEX: #4169e1
```

**Usage:**
- App background (gradient: 221, 83%, 53% → 221, 83%, 35%)
- Header bars
- Card backgrounds (darker shade: 221, 83%, 48%)
- Navigation elements
- Container backgrounds

**Rationale:** Royal Blue is the traditional color of cricket stadium scoreboards, creating instant recognition and sports authenticity.

---

#### **White** - Primary Text
```css
HSL: 0, 0%, 100%
RGB: 255, 255, 255
HEX: #FFFFFF
```

**Usage:**
- Main text content
- Headings and titles
- Labels on dark backgrounds
- Task names
- Navigation text

**Rationale:** Maximum contrast against Royal Blue for readability, mimicking electronic scoreboards.

---

### 2️⃣ GAME STATUS COLORS

#### **Cricket Green** - Runs (Positive)
```css
HSL: 142, 76%, 36%
RGB: 22, 161, 72
HEX: #16A148
```

**Usage:**
- Run count display
- Completed task indicators
- Positive score badges
- Progress bars
- Win confirmation states
- "+X runs earned" messages
- "Hit" button backgrounds

**Visual Examples:**
- Scoreboard: `48 runs` in green
- Task badge: `6 RUNS` with green background
- Progress bar: Green fill indicating completion
- Button: Green "Hit" button for task completion

**Rationale:** Green universally signals success, go-ahead, and positive outcomes. In cricket, runs are the goal, so green reinforces achievement.

---

#### **Cricket Red** - Wickets (Negative)
```css
HSL: 0, 84%, 60%
RGB: 230, 57, 70
HEX: #E63946
```

**Usage:**
- Wicket count display
- Missed task warnings
- Distraction indicators
- Danger/loss states
- Delete actions
- "Wicket lost" messages
- Dismiss button borders

**Visual Examples:**
- Scoreboard: `/ 3 wickets` in red
- Warning: "Wicket lost!" notification in red
- Task card: Red border when dismissed
- Status: "All Out" in red when 10 wickets lost

**Rationale:** Red signals danger, stop, and negative outcomes. In cricket, losing wickets is setback, so red creates urgency to avoid distractions.

---

#### **Yellow** - Accent/Highlights
```css
HSL: 45, 93%, 47%
RGB: 230, 174, 8
HEX: #E6AE08
```

**Usage:**
- Premium badges
- "SENSE" in logo
- Highlight elements
- Important call-to-action accents
- Captain's Call borders

**Rationale:** Yellow/Gold represents achievement, premium features, and attention-grabbing highlights without being alarming.

---

### 3️⃣ SUPPORTING COLORS

#### **Light Blue** - Secondary/Info
```css
HSL: 199, 89%, 48%
RGB: 14, 165, 233
HEX: #0EA5E9
```

**Usage:**
- "LIVE" match status
- Information badges
- T20 mode indicators
- Secondary buttons

---

#### **Muted Blue** - Borders & Backgrounds
```css
HSL: 221, 50%, 30%
RGB: 38, 61, 115
HEX: #263D73
```

**Usage:**
- Card borders
- Input field backgrounds
- Divider lines
- Subtle UI elements

---

## 🎯 Scoreboard Visual Rules

### Cricket Scoreboard Format

**Standard Display:**
```
48 / 3
Overs: 7.2
```

**Color Application:**
- `48` → **Green** (runs scored)
- `/` → **White** (separator)
- `3` → **Red** (wickets lost)
- `Overs: 7.2` → **White** (neutral stat)

---

### Component Examples

#### **Scoreboard Component**
```jsx
<div className="font-mono-score text-7xl">
  <span className="runs-color">48</span>  {/* Green */}
  <span className="text-white">/</span>
  <span className="wickets-color">3</span>  {/* Red */}
</div>
```

#### **Task Run Badge**
```jsx
{/* 1 run - Light blue secondary */}
<span className="bg-secondary/30 text-secondary-foreground border-secondary/50">
  1 RUN
</span>

{/* 4 runs - Medium green */}
<span className="bg-green-600/30 text-green-300 border-green-500/50">
  4 RUNS
</span>

{/* 6 runs - Bright green (maximum) */}
<span className="bg-green-600/40 text-green-200 border-green-400/60">
  6 RUNS
</span>
```

#### **Action Buttons**
```jsx
{/* Hit button - Green for positive action */}
<Button className="bg-green-600 hover:bg-green-700 text-white">
  Hit
</Button>

{/* Dismiss button - Red border for negative action */}
<Button className="border-red-500/50 text-red-300 hover:bg-red-900/20">
  Dismiss
</Button>
```

---

## 📐 Typography Hierarchy

### Font Usage (Unchanged)
- **Headings:** Teko (sporty, bold)
- **Body:** Manrope (clean, readable)
- **Scores:** JetBrains Mono (monospace for digital scoreboard feel)

### Size Hierarchy with Colors
```jsx
{/* Main scoreboard score - Largest, colored */}
<h1 className="text-8xl font-mono-score">
  <span className="runs-color">48</span>/
  <span className="wickets-color">3</span>
</h1>

{/* Match title - Large, white */}
<h2 className="text-3xl font-teko text-white">
  T20 FORMAT
</h2>

{/* Task title - Medium, white */}
<h3 className="text-lg font-semibold text-white">
  Complete workout
</h3>

{/* Labels - Small, muted */}
<p className="text-xs text-muted-foreground uppercase">
  Runs Needed
</p>
```

---

## 🎨 CSS Variables Reference

### Global Variables
```css
:root {
  /* Background & Surface */
  --background: 225 73% 57%;     /* Royal Blue #4169e1 */
  --card: 225 73% 50%;            /* Darker Royal Blue */
  --foreground: 0 0% 100%;        /* White */
  
  /* Status Colors */
  --primary: 142 76% 36%;         /* Green - Runs */
  --destructive: 0 84% 60%;       /* Red - Wickets */
  --secondary: 199 89% 48%;       /* Light Blue - Info */
  --accent: 45 93% 47%;           /* Yellow - Highlights */
  
  /* UI Elements */
  --muted: 225 73% 40%;
  --border: 225 50% 35%;
  --ring: 142 76% 36%;            /* Green focus rings */
}
```

### Custom Utility Classes
```css
.runs-color {
  color: hsl(142, 76%, 36%);    /* Green */
}

.wickets-color {
  color: hsl(0, 84%, 60%);      /* Red */
}

.scoreboard-bg {
  background: hsl(221, 83%, 25%);
  border: 2px solid hsl(221, 50%, 40%);
}
```

---

## 🖼️ Component Color Patterns

### Scoreboard Card
```jsx
<Card className="border-2 border-border bg-card shadow-xl">
  {/* Header - Royal Blue */}
  <div className="bg-card border-b-2 border-border">
    <h2 className="text-white">T20 FORMAT</h2>
  </div>
  
  {/* Score Display - Green & Red */}
  <div className="bg-gradient-to-b from-card to-card/80">
    <div className="font-mono-score text-8xl">
      <span className="runs-color">48</span>
      <span className="text-white">/</span>
      <span className="wickets-color">3</span>
    </div>
  </div>
  
  {/* Stats - Color-coded boxes */}
  <div className="grid grid-cols-2 gap-4">
    <div className="bg-green-900/30 border border-green-600/30">
      <p className="text-green-400">Runs Needed: 12</p>
    </div>
    <div className="bg-red-900/30 border border-red-600/30">
      <p className="text-red-400">Wickets Left: 7</p>
    </div>
  </div>
</Card>
```

### Task Card
```jsx
<Card className="border-2 border-border bg-card">
  {/* Completed - Green theme */}
  {isCompleted && (
    <>
      <div className="h-1 bg-gradient-to-r from-green-600 to-green-500" />
      <div className="bg-green-900/20 border-green-500/50">
        <span className="text-green-400">Task completed! +6 runs</span>
      </div>
    </>
  )}
  
  {/* Dismissed - Red theme */}
  {isDismissed && (
    <>
      <div className="h-1 bg-gradient-to-r from-red-600 to-red-500" />
      <div className="bg-red-900/20 border-red-500/50">
        <span className="text-red-300">Dismissed</span>
      </div>
    </>
  )}
</Card>
```

---

## 🎯 Emotional Color Mapping

| Emotion/Action | Color | Rationale |
|----------------|-------|-----------|
| **Success** | Green | Universal positive signal, aligns with cricket runs |
| **Failure** | Red | Universal warning signal, aligns with wickets lost |
| **Neutral** | White | Clear, readable on blue background |
| **Premium** | Yellow/Gold | Aspirational, valuable, achievement |
| **Information** | Light Blue | Non-intrusive, complementary to royal blue |
| **Urgency** | Red + Bold | Immediate attention for critical states |

---

## ✅ Implementation Checklist

### Completed
- ✅ Royal Blue primary background system
- ✅ White text on all dark backgrounds
- ✅ Green for all run displays
- ✅ Red for all wicket displays
- ✅ Scoreboard format (Runs / Wickets)
- ✅ Color-coded run badges (1, 4, 6)
- ✅ Green "Hit" button
- ✅ Red "Dismiss" button
- ✅ Cricket-style scoreboard layout
- ✅ Color-coded stat boxes (runs, wickets)

### Design Guidelines
- ✅ No dark gradients on text areas
- ✅ High contrast for readability
- ✅ Consistent color usage across all components
- ✅ Scoreboard resembles live cricket broadcast
- ✅ Emotional clarity (green = good, red = bad)

---

## 🎮 User Experience Impact

### Before (Old System)
- Turf Green primary (could be confused with success/failure)
- Less clear visual hierarchy
- Gradient overuse affecting readability

### After (Cricket Scoreboard System)
- **Instant Recognition:** Royal Blue = cricket stadium
- **Clear Status:** Green = runs (good), Red = wickets (bad)
- **Professional Feel:** Matches live cricket broadcasts
- **Better Contrast:** White text on blue, easy to read
- **Emotional Clarity:** No confusion about positive/negative states

---

## 📱 Responsive Behavior

Colors remain consistent across all screen sizes:
- **Mobile:** Same color system, optimized spacing
- **Tablet:** Larger scoreboard numbers, same colors
- **Desktop:** Full scoreboard layout, same colors

**Dark Mode:** Deeper blues but same color relationships maintained.

---

## 🚀 Future Enhancements

1. **Animated Score Updates:** Green numbers count up when runs are earned
2. **Wicket Fall Animation:** Red flash when wicket is lost
3. **Victory Celebration:** Green confetti on match win
4. **Loss State:** Red dim overlay on match loss
5. **Live Match Pulse:** Subtle blue glow around "LIVE" status

---

**Color System Version:** 2.0 (Cricket Scoreboard)  
**Last Updated:** December 13, 2024  
**Status:** ✅ Fully Implemented
