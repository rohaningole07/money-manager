# Money Manager Pro 💰

A modern, responsive live financial dashboard and expense tracker built with vanilla JavaScript, Tailwind CSS, and Chart.js. Designed for clean tracking of daily budgets, automated UPI SMS parsing, dynamic re-amortization across month days, and exportable CSV ledgers.

## 🚀 Features

- **Live Financial Dashboard**: Tracks daily budget targets, discretionary pools, income, fixed costs, and payment mix (UPI vs Cash vs Card).
- **Dynamic Re-Amortization**: Automatically rolls over unspent or overspent amounts across remaining month days.
- **UPI Bank SMS Auto-Parser**: Extract amounts and merchants directly from copied bank SMS notifications.
- **Analytics & Trends**: Visual charts for category breakdowns and payment modes using Chart.js.
- **11 PM Automated Alert**: Daily reminder notification modal summarizing expenditure and setting up tomorrow's target.
- **Data Persistence**: Stores transactions and settings securely in `localStorage`.
- **Light / Dark Mode**: Fully responsive theme support.

## 📂 Project Structure

```text
├── index.html       # Main HTML UI structure
├── style.css        # Custom styling, themes & scrollbar design
└── script.js        # Core application logic, state management & Chart.js integration
```

## 🛠️ Tech Stack

- **HTML5 & Tailwind CSS** (CDN)
- **Vanilla JavaScript (ES6+)**
- **Chart.js** (Analytics charts)
- **Font Awesome** (Icons)
- **Google Fonts** (Inter & JetBrains Mono)

## 📦 Getting Started & GitHub Deployment

1. Clone or download this repository.
2. Ensure `index.html`, `style.css`, and `script.js` are in the same root directory.
3. Open `index.html` in any modern web browser or deploy directly to **GitHub Pages**.
