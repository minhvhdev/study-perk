# 🎓 Study Perk

**Study Perk** is a premium, gamified study productivity application designed to make focused learning rewarding. By combining deep work sessions with an interactive reward system, it turns every study session into an opportunity to earn perks and collect rare cards.

---

## ✨ Key Features

### ⏱️ Focused Study Timer

- **Customizable Intervals**: Quick-select durations or fine-tune your study targets.
- **Deep Focus Mode**: Immersive countdown with ambient sounds (Rain, Waves, Forest, White Noise) to minimize distractions.
- **Smart Persistence**: Your timer state and selected durations persist across page reloads.
- **Completion Rewards**: Finish a session to receive notification sounds and earn **Reward Spins**.

### 🎡 Reward Spin Wheel

- **Earn as You Learn**: Every completed study session grants you spins.
- **Interactive Wheel**: Vibrant, high-performance animations powered by Framer Motion.
- **Store Your Loot**: Winning rewards are automatically saved to your inventory (Chest).

### 🃏 Lucky Card Draw

- **Multiply Your Gains**: Use base rewards from your chest to play a high-stakes card game.
- **The Rules of Luck**:
  - Draw 3 cards from a standard 52-card deck.
  - Calculate your "Luck Score": `Sum of cards (Face cards = 10) % 10`.
  - **The Perfect 9**: If your remainder is 9, your score is boosted to 10!
  - **Multiplier Power**: Your Luck Score multiplies your base reward.
  - **Risk & Reward**: A 0 score means no reward—play wisely.

### 📊 Progress Tracking & History

- **Study Analytics**: Visualize your learning habits with interactive charts.
- **Reward Management**: Keep track of every perk you've earned, use them when needed, and view your used history.
- **Localization**: Full support for English and Vietnamese translations.

---

## 🚀 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Storage**: [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (via IDB-Keyval)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)

---

## 🛠️ Getting Started

First, install the dependencies:

```bash
pnpm install
```

Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 📂 Project Structure

- `app/`: Next.js App Router components and pages.
  - `_components/`: Shared UI components (Timer, Stats, Sidebar).
  - `_store/`: Global state management with Zustand.
  - `_constants/`: Configuration and static data (Translations, Sounds).
  - `reward-spin/`: The spin wheel module.
  - `draw-lucky-cards/`: The card game module.
- `public/`: Static assets like sound files and images.

---

Built with ❤️ for productive students everywhere.
