// Preferencias visuais das estufas salvas em localStorage — tipos de cultivo, logos e status.
const STORAGE_KEY = 'plantelligence-greenhouse-ui-prefs';

// Normaliza texto para comparacoes consistentes.
const normalize = (value) => (value ?? '').toString().trim().toLowerCase();

// Carrega preferencias salvas do usuario no navegador.
export const loadGreenhouseUiPrefs = () => {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_error) {
    return {};
  }
};

// Persiste preferencias de UI no localStorage.
export const saveGreenhouseUiPrefs = (prefs) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs ?? {}));
};

// Tenta identificar o tipo de cultivo pelo nome do perfil.
export const inferCropTypeFromName = (profileName) => {
  const normalized = normalize(profileName);

  if (normalized.includes('champignon')) {
    return 'champignon';
  }

  if (normalized.includes('shimeji')) {
    return 'shimeji';
  }

  if (normalized.includes('shiitake')) {
    return 'shiitake';
  }

  if (normalized.includes('ostra')) {
    return 'ostra';
  }

  if (normalized.includes('portobello')) {
    return 'portobello';
  }

  return 'personalizado';
};

// Resolve o tipo da estufa priorizando preferencia salva.
export const resolveGreenhouseType = (greenhouse, uiPrefs = {}) => {
  const prefType = uiPrefs?.[greenhouse?.id]?.type;
  if (prefType) {
    return prefType;
  }

  if (greenhouse?.profile?.name) {
    return inferCropTypeFromName(greenhouse.profile.name);
  }

  return inferCropTypeFromName(greenhouse?.profileName);
};

export const cropTypeVisuals = {
  champignon: {
    label: 'Champignon',
    icon: 'fa-solid fa-spa',
    ring: 'border-red-200',
    badge: 'bg-red-100 text-red-700',
    iconWrap: 'bg-red-100 text-red-700'
  },
  shimeji: {
    label: 'Shimeji',
    icon: 'fa-solid fa-leaf',
    ring: 'border-teal-200',
    badge: 'bg-teal-100 text-teal-700',
    iconWrap: 'bg-teal-100 text-teal-700'
  },
  shiitake: {
    label: 'Shiitake',
    icon: 'fa-solid fa-seedling',
    ring: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    iconWrap: 'bg-amber-100 text-amber-700'
  },
  ostra: {
    label: 'Cogumelo Ostra',
    icon: 'fa-solid fa-wind',
    ring: 'border-sky-200',
    badge: 'bg-sky-100 text-sky-700',
    iconWrap: 'bg-sky-100 text-sky-700'
  },
  portobello: {
    label: 'Portobello',
    icon: 'fa-solid fa-circle',
    ring: 'border-stone-300',
    badge: 'bg-stone-100 text-stone-700',
    iconWrap: 'bg-stone-100 text-stone-700'
  },
  personalizado: {
    label: 'Personalizado',
    icon: 'fa-solid fa-clover',
    ring: 'border-lime-200',
    badge: 'bg-lime-100 text-lime-700',
    iconWrap: 'bg-lime-100 text-lime-700'
  }
};

const logoCatalogByType = {
  champignon: [
    { icon: 'fa-solid fa-seedling', wrap: 'bg-red-100 text-red-700' },
    { icon: 'fa-solid fa-leaf', wrap: 'bg-green-100 text-green-700' },
    { icon: 'fa-solid fa-spa', wrap: 'bg-teal-100 text-teal-700' }
  ],
  shimeji: [
    { icon: 'fa-solid fa-clover', wrap: 'bg-teal-100 text-teal-700' },
    { icon: 'fa-solid fa-tree', wrap: 'bg-amber-100 text-amber-700' },
    { icon: 'fa-solid fa-leaf', wrap: 'bg-red-100 text-red-700' }
  ],
  shiitake: [
    { icon: 'fa-solid fa-seedling', wrap: 'bg-amber-100 text-amber-700' },
    { icon: 'fa-solid fa-tree', wrap: 'bg-orange-100 text-orange-700' },
    { icon: 'fa-solid fa-spa', wrap: 'bg-amber-100 text-amber-700' }
  ],
  ostra: [
    { icon: 'fa-solid fa-wind', wrap: 'bg-sky-100 text-sky-700' },
    { icon: 'fa-solid fa-leaf', wrap: 'bg-teal-100 text-teal-700' },
    { icon: 'fa-solid fa-clover', wrap: 'bg-sky-100 text-sky-700' }
  ],
  portobello: [
    { icon: 'fa-solid fa-circle', wrap: 'bg-stone-100 text-stone-700' },
    { icon: 'fa-solid fa-seedling', wrap: 'bg-stone-100 text-stone-700' },
    { icon: 'fa-solid fa-leaf', wrap: 'bg-stone-100 text-stone-700' }
  ],
  personalizado: [
    { icon: 'fa-solid fa-seedling', wrap: 'bg-lime-100 text-lime-700' },
    { icon: 'fa-solid fa-clover', wrap: 'bg-green-100 text-green-700' },
    { icon: 'fa-solid fa-spa', wrap: 'bg-red-100 text-red-700' }
  ]
};

// Gera hash simples para escolher logo de forma deterministica.
const hashText = (value) => {
  const input = (value ?? '').toString();
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
};

// Seleciona uma logo fixa por estufa, evitando troca aleatoria na tela.
export const resolveCatalogLogo = (greenhouseId, type = 'personalizado') => {
  const catalog = logoCatalogByType[type] ?? logoCatalogByType.personalizado;
  const index = hashText(greenhouseId) % catalog.length;
  return catalog[index];
};

// Define o visual do status com base na configuracao e nos alertas.
export const resolveStatusVisual = (greenhouse) => {
  if (!greenhouse?.flowerProfileId && !greenhouse?.profile) {
    return {
      label: 'Sem dados',
      dot: 'bg-slate-400',
      text: 'text-slate-600',
      chip: 'bg-slate-100 text-slate-700'
    };
  }

  if (greenhouse?.alertsEnabled === false) {
    return {
      label: 'Atenção',
      dot: 'bg-amber-500',
      text: 'text-amber-700',
      chip: 'bg-amber-100 text-amber-700'
    };
  }

  return {
    label: 'OK',
    dot: 'bg-red-500',
    text: 'text-red-700',
    chip: 'bg-red-100 text-red-700'
  };
};
