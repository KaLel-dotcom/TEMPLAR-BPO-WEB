/*
 * Templar BPO website script
 *
 * This file contains the logic for rendering the BPO catalog,
 * handling search, category filtering, missing-only toggle, and
 * persisting owned status in localStorage. The page assumes
 * window.BPO_DATA has been populated (see data.js).
 */

// Currently selected category. null means "all categories".
let selectedCategory = null;

// Initialise the page once the DOM has loaded.
document.addEventListener('DOMContentLoaded', () => {
  renderCategoryList();
  renderBPOList();
});

// Determine whether a blueprint is marked as owned in localStorage.
function isOwned(typeId) {
  return localStorage.getItem('owned_' + typeId) === 'true';
}

// Toggle the owned status for a given blueprint and re-render the list.
function toggleOwned(typeId) {
  const newValue = !isOwned(typeId);
  localStorage.setItem('owned_' + typeId, newValue.toString());
  renderBPOList();
}

// Render the list of categories in the sidebar. When the user clicks
// a category, it will set selectedCategory and re-render both the
// category list (to highlight the current selection) and the BPO list.
function renderCategoryList() {
  const listEl = document.getElementById('categoryList');
  listEl.innerHTML = '';

  // Compute unique categories from the data
  const cats = Array.from(new Set(window.BPO_DATA.map(b => b.category)));
  cats.sort();

  // Helper for creating each list item
  function addItem(cat, displayName) {
    const li = document.createElement('li');
    li.textContent = displayName;
    // Apply an "active" class when this category is selected
    li.className = (selectedCategory === cat) ? 'active' : '';
    li.onclick = () => {
      // Toggle off if clicking the same category again
      if (selectedCategory === cat) {
        selectedCategory = null;
      } else {
        selectedCategory = cat;
      }
      renderCategoryList();
      renderBPOList();
    };
    listEl.appendChild(li);
  }

  // Add "All" option at the top
  addItem(null, 'All');
  cats.forEach(cat => addItem(cat, cat));
}

// Render the BPO list into the table body, applying the current search
// string, selected category filter, and missing-only toggle.
function renderBPOList() {
  const tbody = document.getElementById('bpoList');
  tbody.innerHTML = '';

  const search = document.getElementById('searchInput').value.trim().toLowerCase();
  const showMissing = document.getElementById('showMissing').checked;

  // Filter data according to search, category, and missing toggle
  const filtered = window.BPO_DATA.filter(item => {
    // Category filter
    if (selectedCategory && item.category !== selectedCategory) {
      return false;
    }
    // Search filter: match on name or typeId
    if (search) {
      const matchName = item.name.toLowerCase().includes(search);
      const matchId = String(item.typeId).includes(search);
      if (!matchName && !matchId) return false;
    }
    // Missing filter: only include if not owned
    if (showMissing && isOwned(item.typeId)) {
      return false;
    }
    return true;
  });

  // Sort by name then by typeId to provide consistent ordering
  filtered.sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    // tie-break by typeId
    return String(a.typeId).localeCompare(String(b.typeId));
  });

  // Create table rows
  for (const item of filtered) {
    const row = document.createElement('tr');
    row.className = isOwned(item.typeId) ? 'owned' : '';

    // Owned checkbox cell
    const ownedCell = document.createElement('td');
    ownedCell.className = 'p-2 border-b';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = isOwned(item.typeId);
    checkbox.onchange = () => toggleOwned(item.typeId);
    ownedCell.appendChild(checkbox);
    row.appendChild(ownedCell);

    // Type ID cell with optional link to external site (e.g. Fuzzwork/Everef)
    const idCell = document.createElement('td');
    idCell.className = 'p-2 border-b text-blue-600 underline cursor-pointer';
    idCell.textContent = item.typeId;
    idCell.title = 'Open external reference';
    idCell.onclick = () => {
      // Example link template: Everef item page
      const url = `https://everef.net/type/${item.typeId}`;
      window.open(url, '_blank');
    };
    row.appendChild(idCell);

    // Blueprint name cell
    const nameCell = document.createElement('td');
    nameCell.className = 'p-2 border-b';
    nameCell.textContent = item.name;
    row.appendChild(nameCell);

    // Category cell
    const catCell = document.createElement('td');
    catCell.className = 'p-2 border-b';
    catCell.textContent = item.category;
    row.appendChild(catCell);

    // Group cell
    const groupCell = document.createElement('td');
    groupCell.className = 'p-2 border-b';
    groupCell.textContent = item.group;
    row.appendChild(groupCell);

    tbody.appendChild(row);
  }
}