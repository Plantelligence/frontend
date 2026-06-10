/**
 * greenhouseUiPrefs.js - Preferências visuais dos cards de estufa.
 *
 * Mapeia tipos de cultivo (cogumelo, personalizado, etc.) para:
 *   - Cores de badge e borda
 *   - Ícone do logo
 *   - Label legível
 *
 * Centralizado aqui para que CardEstufa e GreenhousesPage usem
 * a mesma identidade visual sem duplicação.
 */

// preferências visuais das estufas: tipo de cultivo, logos, status
// chave usada para persistir as preferências de tipo no localStorage por estufa
const STORAGE_KEY = 'plantelligence-greenhouse-ui-prefs';

// Converte qualquer valor para string minúscula sem espaços — facilita comparações
const normalize = (value) => (value ?? '').toString().trim().toLowerCase();

// Carrega as preferências visuais salvas do localStorage
export const loadGreenhouseUiPrefs = () => {
  // Proteção para ambientes sem window (SSR ou testes)
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    // Garante que o retorno seja sempre um objeto, mesmo que o JSON esteja corrompido
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_error) {
    return {};
  }
};

// Salva as preferências visuais atuais no localStorage
export const saveGreenhouseUiPrefs = (prefs) => {
  if (typeof window === 'undefined') {
    return;
  }

  // Converte para JSON e persiste; null é tratado como objeto vazio
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs ?? {}));
};

// Infere o tipo de cultivo a partir do nome do perfil vinculado à estufa
// permite identificar o tipo sem que o backend precise retornar um campo explícito
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

  // Se o nome não corresponder a nenhum tipo conhecido, usa "personalizado"
  return 'personalizado';
};

// Determina o tipo visual da estufa, priorizando a preferência salva pelo usuário
// Se não houver preferência, infere pelo nome do perfil de cultivo vinculado
export const resolveGreenhouseType = (greenhouse, uiPrefs = {}) => {
  // Preferência explícita do usuário para esta estufa específica tem prioridade
  const prefType = uiPrefs?.[greenhouse?.id]?.type;
  if (prefType) {
    return prefType;
  }

  // Tenta inferir pelo nome do perfil embutido na estufa
  if (greenhouse?.profile?.name) {
    return inferCropTypeFromName(greenhouse.profile.name);
  }

  // Fallback: tenta pelo campo legado profileName
  return inferCropTypeFromName(greenhouse?.profileName);
};

// Mapeamento de tipo de cultivo para classes Tailwind de cores e ícone
// cada tipo tem: label exibido, ícone FontAwesome, cor da borda e do badge
export const cropTypeVisuals = {
  champignon: {
    label: 'Champignon',
    icon: 'fa-solid fa-spa',
    // Borda vermelha para champignon — escolha baseada na cor do cogumelo
    ring: 'border-red-200 dark:border-red-500/30',
    badge: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
    iconWrap: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
  },
  shimeji: {
    label: 'Shimeji',
    icon: 'fa-solid fa-leaf',
    // Teal remete à cor esverdeada do shimeji branco
    ring: 'border-teal-200 dark:border-teal-500/30',
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400',
    iconWrap: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400'
  },
  shiitake: {
    label: 'Shiitake',
    icon: 'fa-solid fa-seedling',
    // Âmbar remete à coloração marrom-escuro do shiitake
    ring: 'border-amber-200 dark:border-amber-500/30',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    iconWrap: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
  },
  personalizado: {
    label: 'Personalizado',
    icon: 'fa-solid fa-clover',
    // Lime/verde para perfis personalizados — cor neutra e associada à natureza
    ring: 'border-lime-200 dark:border-lime-500/30',
    badge: 'bg-lime-100 text-lime-700 dark:bg-lime-500/10 dark:text-lime-400',
    iconWrap: 'bg-lime-100 text-lime-700 dark:bg-lime-500/15 dark:text-lime-400'
  }
};

// Catálogo de logos (ícone + cor) disponíveis para cada tipo de cultivo
// cada estufa recebe um logo determinístico baseado no seu ID
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
// o mesmo ID sempre produz o mesmo logo — evita troca de ícone ao recarregar a página
const hashText = (value) => {
  const input = (value ?? '').toString();
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    // Multiplicação por 31 é um algoritmo clássico de hash para strings
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
};

// Retorna o logo (ícone + cor) da estufa a partir do catálogo do seu tipo
export const resolveCatalogLogo = (greenhouseId, type = 'personalizado') => {
  const catalog = logoCatalogByType[type] ?? logoCatalogByType.personalizado;
  // Usa o hash do ID para selecionar um índice fixo no catálogo
  const index = hashText(greenhouseId) % catalog.length;
  return catalog[index];
};

// Retorna informações de status visual para o card da estufa
export const resolveStatusVisual = (greenhouse) => {
  // Sem perfil vinculado: estufa recém-criada, sem dados configurados
  if (!greenhouse?.flowerProfileId && !greenhouse?.profile) {
    return {
      label: 'Sem dados',
      dot: 'bg-slate-400',
      text: 'Aguardando dados do sensor',
    };
  }
  // Com perfil: resolve o tipo visual normalmente
  return resolveGreenhouseType(greenhouse);
}
