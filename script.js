const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTxKBfA7JrcpQEKlg9KI5OoRw5kxsAjQF0A2nSDBAiZ_P9_CYxRcAXaXX9xR0_Z8ZHvpNBKWu3eWNcl/pub?gid=0&single=true&output=csv";

async function loadMenu() {
  const container = document.getElementById("menu-container");

  try {
    const res = await fetch(SHEET_CSV_URL);
    const text = await res.text();

    const lines = text.trim().split(/\r?\n/);

    if (!lines.length) {
      container.innerHTML = "<p>Kunde inte läsa menyn (tom fil).</p>";
      return;
    }

    const firstLine = lines[0];

    // Kolla först efter tabbar, annars ; eller ,
    let delimiter = "\t";
    if (firstLine.includes("\t")) {
      delimiter = "\t";
    } else if (firstLine.includes(";")) {
      delimiter = ";";
    } else if (firstLine.includes(",")) {
      delimiter = ",";
    }

    const rawHeader = firstLine.split(delimiter);
    const header = rawHeader.map((h) => h.trim().toLowerCase());

    const rows = lines.slice(1).map((line) => line.split(delimiter));

    const idxKategori = header.indexOf("kategori");
    const idxNamn = header.indexOf("namn");
    const idxBeskrivning = header.indexOf("beskrivning");
    const idxPris = header.indexOf("pris");

    if (idxNamn === -1 || idxPris === -1) {
      container.innerHTML =
        "<p>Kunde inte läsa menyn (saknar kolumnnamn).</p>";
      return;
    }

    const itemsByCategory = {};

    for (const row of rows) {
      if (!row[idxNamn] && !row[idxPris]) continue;

      const kat = (row[idxKategori] || "Övrigt").trim();
      const name = (row[idxNamn] || "").trim();
      let desc = idxBeskrivning !== -1 ? (row[idxBeskrivning] || "").trim() : "";
      let price = (row[idxPris] || "").trim();

      const hasDigits = (str) => /\d/.test(str);

      if (!hasDigits(price) && !desc) {
        const extra = row.slice(idxPris + 1).find((cell) => cell && hasDigits(cell));
        if (extra) {
          desc = price;          // t.ex. "sallad"
          price = extra.trim();  // t.ex. "80:-"
        }
      }

      const item = { name, desc, price };

      if (!itemsByCategory[kat]) itemsByCategory[kat] = [];
      itemsByCategory[kat].push(item);

    }

    container.innerHTML = "";

    Object.keys(itemsByCategory).forEach((category) => {
      const catTitle = document.createElement("h3");
      catTitle.className = "category-title";
      catTitle.textContent = category;
      container.appendChild(catTitle);

      itemsByCategory[category].forEach((item) => {
        const div = document.createElement("div");
        div.className = "menu-item";

        const left = document.createElement("div");
        const name = document.createElement("div");
        name.className = "menu-name";
        name.textContent = item.name;
        left.appendChild(name);

        if (item.desc) {
          const desc = document.createElement("div");
          desc.className = "menu-desc";
          desc.textContent = item.desc;
          left.appendChild(desc);
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
