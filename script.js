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
    container.innerHTML = "<p>Laddar meny…</p>";
  
    try {
      const res = await fetch(SHEET_CSV_URL);
      if (!res.ok) throw new Error("HTTP-fel: " + res.status);
  
      const text = await res.text();
      const lines = text.trim().split(/\r?\n/).filter((l) => l.trim() !== "");
  
      if (!lines.length) {
        container.innerHTML = "<p>Kunde inte läsa menyn (tom fil).</p>";
        return;
      }
  
      const rows = lines.map(parseCsvLine);
  
      const headers = rows[0].map((h) => h.trim().toLowerCase());
      const dataRows = rows.slice(1);
  
      const idxCategory = headers.findIndex((h) => h.includes("kategori"));
      const idxName = headers.findIndex((h) => h.includes("namn"));
      const idxDesc = headers.findIndex((h) => h.includes("beskriv"));
  
      if (idxName === -1) {
        container.innerHTML =
          "<p>Kunde inte läsa menyn (saknar kolumnen 'namn').</p>";
        return;
      }
  
      const itemsByCategory = {};
  
      for (const row of dataRows) {
        const name = (row[idxName] || "").trim();
        if (!name) continue;
  
        const category =
          idxCategory !== -1 ? (row[idxCategory] || "Övrigt").trim() : "Övrigt";
  
        let desc = idxDesc !== -1 ? (row[idxDesc] || "").trim() : "";
  
        // Hitta sista cellen som innehåller en siffra = pris
        let price = "";
        let priceIndex = -1;
        for (let i = row.length - 1; i >= 0; i--) {
          const cell = (row[i] || "").trim();
          if (/\d/.test(cell)) {
            price = cell;
            priceIndex = i;
            break;
          }
        }
  
        // Om vi fortfarande inte har beskrivning:
        // plocka alla icke-tomma, icke-siffersaker (t.ex. "sallad") som extra beskrivning
        if (!desc) {
          const extras = [];
          for (let i = 0; i < row.length; i++) {
            if (i === idxCategory || i === idxName || i === idxDesc || i === priceIndex) continue;
            const cell = (row[i] || "").trim();
            if (!cell) continue;
            if (!/\d/.test(cell)) extras.push(cell);
          }
          if (extras.length) desc = extras.join(", ");
        }
  
        if (!itemsByCategory[category]) itemsByCategory[category] = [];
        itemsByCategory[category].push({ name, desc, price });
      }
  
      container.innerHTML = "";
  
      const categories = Object.keys(itemsByCategory);
      if (!categories.length) {
        container.innerHTML =
          "<p>Kunde inte läsa menyn (inga rader hittades).</p>";
        return;
      }
  
      // Bygg upp HTML enligt din design
      categories.forEach((cat) => {
        const h3 = document.createElement("h3");
        h3.className = "category-title";
        h3.textContent = cat;
        container.appendChild(h3);
  
        itemsByCategory[cat].forEach((item) => {
          const div = document.createElement("div");
          div.className = "menu-item";
  
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
    } catch (err) {
      console.error(err);
      container.innerHTML = "<p>Kunde inte ladda menyn.</p>";
    }
  }
  
  loadMenu();
  