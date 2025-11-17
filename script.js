const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTxKBfA7JrcpQEKlg9KI5OoRw5kxsAjQF0A2nSDBAiZ_P9_CYxRcAXaXX9xR0_Z8ZHvpNBKWu3eWNcl/pub?gid=0&single=true&output=csv";

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];

    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += c;
    }
  }

  result.push(current);
  return result;
}

async function loadMenu() {
  const container = document.getElementById("menu-container");
  if (!container) return;

  try {
    const response = await fetch(SHEET_CSV_URL);
    if (!response.ok) {
      throw new Error("Nätverksfel när menyn skulle hämtas");
    }

    const csv = await response.text();
    const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);

    if (lines.length === 0) {
      container.innerHTML = "<p>Ingen meny hittades.</p>";
      return;
    }

    // Huvudrad: hitta rätt kolumner
    const header = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());

    const colCategory = header.indexOf("kategori");
    const colName = header.indexOf("namn");
    const colDesc = header.indexOf("beskrivning");
    const colPrice = header.indexOf("pris");

    if (colName === -1 || colPrice === -1) {
      container.innerHTML =
        "<p>Kunde inte läsa menyn (saknar kolumnerna 'namn' och 'pris').</p>";
      return;
    }

    const items = [];

    for (let i = 1; i < lines.length; i++) {
      const row = parseCsvLine(lines[i]);
      if (row.every((c) => c.trim() === "")) continue;

      const item = {
        category: colCategory !== -1 ? (row[colCategory] || "").trim() : "",
        name: (row[colName] || "").trim(),
        desc: colDesc !== -1 ? (row[colDesc] || "").trim() : "",
        price: (row[colPrice] || "").trim(),
      };

      if (!item.name) continue;
      items.push(item);
    }

    if (items.length === 0) {
      container.innerHTML = "<p>Inga rätter hittades i menyn.</p>";
      return;
    }

    // Gruppera per kategori
    const itemsByCategory = {};
    const categories = [];

    items.forEach((item) => {
      const cat = item.category || "Meny";
      if (!itemsByCategory[cat]) {
        itemsByCategory[cat] = [];
        categories.push(cat);
      }
      itemsByCategory[cat].push(item);
    });

    // Töm container innan vi bygger upp menyn
    container.innerHTML = "";

    categories.forEach((cat) => {
      const h3 = document.createElement("h3");
      h3.className = "category-title fade-up";
      h3.textContent = cat;
      container.appendChild(h3);

      itemsByCategory[cat].forEach((item) => {
        const div = document.createElement("div");
        div.className = "menu-item fade-up";

        const left = document.createElement("div");

        const nameEl = document.createElement("div");
        nameEl.className = "menu-name";
        nameEl.textContent = item.name;
        left.appendChild(nameEl);

        if (item.desc) {
          const descEl = document.createElement("div");
          descEl.className = "menu-desc";
          descEl.textContent = item.desc;
          left.appendChild(descEl);
        }

        const right = document.createElement("div");
        right.className = "menu-price";
        right.textContent = item.price;

        div.appendChild(left);
        div.appendChild(right);
        container.appendChild(div);
      });
    });

    // När menyn är byggd – koppla på animationerna även på nya element
    setupScrollAnimations();
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Kunde inte ladda menyn.</p>";
  }
}

/**
 * Scroll-reveal animationer
 */
function setupScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("reveal");
          observer.unobserve(e.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  document
    .querySelectorAll(".fade-up, .fade-left, .fade-right, .fade-down")
    .forEach((el) => observer.observe(el));
}

function updateTodayHours() {
  const heroHours = document.querySelector(".hero-hours");
  if (!heroHours) return;

  const today = new Date();
  const day = today.getDay(); // 0 = söndag, 1 = måndag, ...

  const hoursByDay = {
    0: { label: "Söndag", text: "Stängt", closed: true },
    1: { label: "Måndag", text: "11:00 – 19:00" },
    2: { label: "Tisdag", text: "11:00 – 19:00" },
    3: { label: "Onsdag", text: "11:00 – 19:00" },
    4: { label: "Torsdag", text: "11:00 – 19:00" },
    5: { label: "Fredag", text: "11:00 – 19:00 / 22:30 – 03:30" },
    6: { label: "Lördag", text: "22:30 – 03:30" },
  };

  const info = hoursByDay[day];

  if (!info) return;

  if (info.closed) {
    heroHours.textContent = `${info.label}: Stängt`;
  } else {
    heroHours.textContent = `${info.label}: ${info.text}`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadMenu();
  setupScrollAnimations();
  updateTodayHours();
});