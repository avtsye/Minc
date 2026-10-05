# Mincraft 2D Enhanced

גרסה מורחבת מאוד של הפרויקט המקורי **Mincraft-Game**, שנבנתה כמשחק Web עצמאי ב־HTML, CSS ו־JavaScript מודולרי.

## הפעלה

פתח ישירות:

https://raw.githack.com/avtsye/Minc/main/index.html

או מקומית:

```bash
python -m http.server 8000
```

ואז:

```
http://localhost:8000
```

## יכולות עיקריות

- דמות שחקן עם WASD/חצים, קפיצה, כוח משיכה והתנגשות
- מצלמה שעוקבת אחרי השחקן
- טווח כרייה ובנייה סביב השחקן
- תמיכה ב־Gamepad
- תמיכה בכפתורי מגע במסכים קטנים
- כמה עולמות נפרדים עם שמירה מקומית
- יצירת עולם לפי Seed
- Normal / Flat / Cave / Sky World
- גדלי עולם Small / Medium / Large
- שינוי שם, שכפול, מחיקה, Export ו־Import של עולמות
- Survival ו־Creative
- Hotbar עם מקשים 1–9
- Inventory
- Crafting
- Furnace
- Chest עם אחסון נפרד
- Tool tiers ו־XP
- Undo / Redo
- Achievements וסטטיסטיקות
- יום/לילה
- Minimap עם ניווט בלחיצה
- Export של המפה כ־PNG
- Fullscreen
- Zoom
- FPS counter
- מוזיקה ואפקטים
- Autosave
- PWA + Service Worker לשימוש אופליין לאחר טעינה ראשונה
- חלונית עזרה מפורטת בעברית
- UI רספונסיבי

## קיצורי מקלדת

| מקש | פעולה |
|---|---|
| WASD / חצים | תנועה |
| Space / ↑ | קפיצה |
| 1–9 | Hotbar |
| E | מלאי |
| C | Crafting |
| F | Furnace |
| H | עזרה |
| P | Pause |
| S | שמירה |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |

## מבנה הקוד

המנוע חולק למודולים:

- `scripts/main.js` – בקרת המשחק וה־UI
- `scripts/app/data.js` – בלוקים, כלים ומתכונים
- `scripts/app/world.js` – יצירה פרוצדורלית ו־Spawn
- `scripts/app/player.js` – פיזיקה, תנועה ו־Gamepad
- `scripts/app/storage.js` – שמירות, עולמות, Export/Import
- `sw.js` – Service Worker
- `manifest.json` – PWA

## בדיקות

המאגר כולל שתי שכבות CI:

1. **Validate game** – תחביר JavaScript, נתיבים יחסיים ו־Smoke Test.
2. **Browser QA** – Chromium/Playwright שמבצע תרחיש משחק אמיתי: יצירת עולם, תנועה, מלאי, Crafting, Furnace, בנייה, Undo/Redo, שמירה וניהול עולמות.

## קרדיט

מבוסס על:

https://github.com/eladjmc/Mincraft-Game
