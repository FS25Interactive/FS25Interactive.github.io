import './styles/main.css';

// Add a new entry here whenever another map goes live - that's the only change needed.
const maps = [
  {
    name: "Kinlaig",
    desc: "Modded custom map. 48 fields + 27 land parcels, owner/crop/soil/work tracking, Precision Farming guide.",
    fields: "75",
    kind: "Modded map",
    url: "https://keiranpoly2611.github.io/Kinlaig-Map-FS25/",
    thumbGradient: "linear-gradient(135deg, #14532d, #166534, #1d9e75)",
    cover: "/covers/kinlaig.jpg"
  },
  {
    name: "Zielonka",
    desc: "Official FS25 map. 109 fields, same tracking tools and Precision Farming guide as every other map here.",
    fields: "109",
    kind: "Official map",
    url: "https://keiranpoly2611.github.io/Zielonka-Map-FS25/",
    thumbGradient: "linear-gradient(135deg, #1e3a5f, #1d6fa5, #38bdf8)",
    cover: "/covers/zielonka.jpg"
  },
  {
    name: "Hutan Pantai",
    desc: "Official FS25 map. 80 fields, same tracking tools and Precision Farming guide as every other map here.",
    fields: "80",
    kind: "Official map",
    url: "https://keiranpoly2611.github.io/HutanPantai-Map-FS25/",
    thumbGradient: "linear-gradient(135deg, #164e63, #0e7490, #2dd4bf)",
    cover: "/covers/hutanpantai.jpg"
  },
  {
    name: "Riverbend Springs",
    desc: "Official FS25 map. 93 fields, same tracking tools and Precision Farming guide as every other map here.",
    fields: "93",
    kind: "Official map",
    url: "https://keiranpoly2611.github.io/RiverbendSprings-Map-FS25/",
    thumbGradient: "linear-gradient(135deg, #713f12, #a16207, #facc15)",
    cover: "/covers/riverbendsprings.jpg"
  }
];

const grid = document.getElementById('mapGrid');
grid.innerHTML = maps.map(m => `
  <a class="map-card card bg-base-200 border border-base-300 shadow-lg hover:border-primary/60 hover:-translate-y-0.5 transition-all no-underline text-inherit" href="${m.url}">
    <div class="card-body p-5">
      <div class="h-28 rounded-xl mb-4 relative overflow-hidden" style="${m.cover ? `background-image:url('${m.cover}');background-size:cover;background-position:center` : `background-image:${m.thumbGradient}`}">
        <div class="absolute inset-x-0 bottom-0 h-2/3" style="background:linear-gradient(180deg, rgba(11,15,20,0) 40%, rgba(11,15,20,.75))"></div>
      </div>
      <h2 class="text-lg font-semibold mb-1">${m.name}</h2>
      <p class="text-sm text-base-content/60 leading-normal flex-1">${m.desc}</p>
      <div class="flex gap-5 my-3">
        <div><div class="text-base font-semibold">${m.fields}</div><div class="text-xs text-base-content/50 uppercase tracking-wide">Fields</div></div>
        <div><div class="text-base font-semibold">${m.kind}</div><div class="text-xs text-base-content/50 uppercase tracking-wide">Type</div></div>
      </div>
      <span class="btn btn-primary w-full"><i class="ti ti-map-2" aria-hidden="true"></i> Open map</span>
    </div>
  </a>
`).join('');
