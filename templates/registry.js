const templates = {
  '2p-simple': () => import('./2p-simple.js'),
  '2p-pair1': () => import('./2p-pair1.js'),
  'pattern-header': () => import('./pattern-header.js'),
  '30p-pair': () => import('./30p-pair.js')
};

export async function loadTemplate(id) {
  if (!Object.hasOwn(templates, id)) return null;
  const { default: definition } = await templates[id]();
  const { size, tabs, initialState, createScene, fields } = definition;
  if (definition.templateId !== id || !size ||
      !Number.isSafeInteger(size.width) || size.width <= 0 ||
      !Number.isSafeInteger(size.height) || size.height <= 0 ||
      typeof initialState !== 'function' || typeof createScene !== 'function' ||
      typeof fields !== 'function') throw new Error('템플릿 ID·크기·함수 정의를 확인해 주세요.');
  const items = typeof tabs === 'function' ? tabs(initialState()) : tabs;
  if (!Array.isArray(items) || !items.some(t => t.type !== 'action') ||
      new Set(items.map(t => t.id)).size !== items.length) throw new Error('탭 ID는 중복될 수 없으며 내용 탭이 하나 이상 필요해요.');
  return definition;
}
