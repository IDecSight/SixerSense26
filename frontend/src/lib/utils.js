import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatOvers(balls) {
  const overs = Math.floor(balls / 6);
  const remainingBalls = balls % 6;
  return `${overs}.${remainingBalls}`;
}

export function calculateStrikeRate(runs, balls) {
  if (balls === 0) return 0;
  return ((runs / balls) * 100).toFixed(1);
}

export function getMatchStatus(match) {
  if (match.status === 'won') return 'Won';
  if (match.status === 'lost') return 'Lost';
  if (match.total_wickets >= 10) return 'All Out';
  return 'In Progress';
}

export function getCategoryIcon(category) {
  const icons = {
    Health: '💪',
    Career: '💼',
    Finance: '💰',
    Relationships: '❤️',
    'Spiritual/Mindset': '🧘',
    'Travel/Leisure': '✈️',
  };
  return icons[category] || '📝';
}
