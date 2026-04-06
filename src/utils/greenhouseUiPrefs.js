// preferências visuais das estufas: tipo de cultivo, logos, status
const STORAGE_KEY = 'plantelligence-greenhouse-ui-prefs';

const normalize = (value) => (value ?? '').toString().trim().toLowerCase();

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

export const saveGreenhouseUiPrefs = (prefs) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs ?? {}));
};

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

  return 'personalizado';
};

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
  personalizado: [
    { icon: 'fa-solid fa-seedling', wrap: 'bg-lime-100 text-lime-700' },
    { icon: 'fa-solid fa-clover', wrap: 'bg-green-100 text-green-700' },
    { icon: 'fa-solid fa-spa', wrap: 'bg-red-100 text-red-700' }
  ]
};

// hash simples para logo determinística por estufa (sem aleatoriedade na tela)
const hashText = (value) => {
  const input = (value ?? '').toString();
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
};

export const resolveCatalogLogo = (greenhouseId, type = 'personalizado') => {
  const catalog = logoCatalogByType[type] ?? logoCatalogByType.personalizado;
  const index = hashText(greenhouseId) % catalog.length;
  return catalog[index];
};

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
