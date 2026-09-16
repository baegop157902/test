    import { decodeImage, notify, MAX_STICKERS } from './state.js';

    export function createStickers(stage, store, onSelect) {
    const { size } = store.definition;
    const Math_max = Math.max, Math_min = Math.min;
    const maxSize = Math_max(size.width, size.height) * 2;
    const BUTTON_GAP = 2;
    const K = window.Konva, compact = matchMedia('(max-width: 1024px)');
    const layer = new K.Layer(); stage.add(layer);
    
    const transformer = new K.Transformer({
        rotateEnabled: true, keepRatio: true, flipEnabled: false,
        enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'], anchorSize: compact.matches ? 16 : 10,
        rotateAnchorOffset: compact.matches ? 26 : 22, padding: 2, borderStroke: '#08b8ef', anchorStroke: '#08b8ef',
        anchorStyleFunc(anchor) { if (anchor.hasName('rotater')) anchor.setAttrs({ width: 24, height: 24, offsetX: 12, offsetY: 12, cornerRadius: 4, fill: '#fff' }); },
        boundBoxFunc(oldBox, newBox) { return Math.abs(newBox.width) < 12 || Math.abs(newBox.height) < 12 || Math.abs(newBox.width) > maxSize * stage.scaleX() || Math.abs(newBox.height) > maxSize * stage.scaleX() ? oldBox : newBox; }
    });
    layer.add(transformer); 
    
    const nodes = new Map(), shadowButtons = new Map(), outlineButtons = new Map(); 
    let selected = null, epoch = 0;

    if (!document.getElementById('sticker-custom-styles')) {
        const style = document.createElement('style');
        style.id = 'sticker-custom-styles';
        style.textContent = `
            @media (max-width: 1024px) {
                .sticker-list { padding-bottom: 86px !important; }
            }
            .sticker-outline-canvas { position: fixed; z-index: 140; }
        `;
        document.head.appendChild(style);
    }

    const rotateIcon = document.createElement('span'); rotateIcon.className = 'sticker-rotate-icon'; rotateIcon.setAttribute('aria-hidden', 'true'); rotateIcon.hidden = true;
    rotateIcon.innerHTML = '<i class="bi bi-arrow-counterclockwise"></i>'; document.body.append(rotateIcon);
    
    function positionRotationIcon() {
        const anchor = transformer.findOne('.rotater');
        rotateIcon.hidden = !selected || !anchor || !transformer.visible(); if (rotateIcon.hidden) return;
        const r = anchor.getClientRect(), c = stage.container().getBoundingClientRect();
        rotateIcon.style.left = (c.left + r.x + r.width / 2) + 'px'; rotateIcon.style.top = (c.top + r.y + r.height / 2) + 'px';
    }
    layer.on('draw', positionRotationIcon);
    
    function toggleShadow(id) { store.change(s => { const item = s.stickers.find(i => i.id === id); if (item) item.shadow = !item.shadow; }, 'stickers'); }
    
    function toggleOutline(id) { 
        store.change(s => { 
            const item = s.stickers.find(i => i.id === id);
            if (item) item.outline = !item.outline; 
        }, 'stickers'); 
    }

    let isInjecting = false;
    const injectMobileButtons = () => {
        if (isInjecting) return;
        isInjecting = true;
        
        const cards = document.querySelectorAll('.sticker-list .sticker-card');
        if (cards.length > 0) {
            store.state.stickers.forEach((item, i) => {
                const card = cards[i];
                if (!card) return;
                
                const hasOutline = !!item.outline;

                let outlineBtn = card.querySelector('.mobile-outline-btn');
                if (!outlineBtn) {
                    outlineBtn = document.createElement('button');
                    outlineBtn.type = 'button';
                    outlineBtn.className = 'sticker-shadow-toggle mobile-outline-btn';
                    outlineBtn.style.position = 'absolute';
                    outlineBtn.style.top = 'calc(100% + 40px)';
                    outlineBtn.style.left = '50%';
                    outlineBtn.style.transform = 'translateX(-50%)';
                    outlineBtn.style.width = 'max-content';
                    outlineBtn.onclick = () => toggleOutline(item.id);
                    card.appendChild(outlineBtn);
                }
                
                const newText = hasOutline ? '외곽선 삭제' : '외곽선 추가';
                if (outlineBtn.textContent !== newText) outlineBtn.textContent = newText;
                
                const newPressed = String(hasOutline);
                if (outlineBtn.getAttribute('aria-pressed') !== newPressed) outlineBtn.setAttribute('aria-pressed', newPressed);
            });
        }
        isInjecting = false;
    };

    store.subscribe((state, kind) => {
        if (kind === 'stickers') {
            queueMicrotask(injectMobileButtons);
        }
    });

    new MutationObserver(() => {
        injectMobileButtons();
    }).observe(document.body, { childList: true, subtree: true });
    
    const deleteButton = document.createElement('button'); deleteButton.className = 'sticker-canvas-delete'; deleteButton.type = 'button';
    deleteButton.textContent = '×'; deleteButton.setAttribute('aria-label', '선택한 스티커 삭제'); deleteButton.hidden = true; document.body.append(deleteButton);
    
    function positionDelete() {
        positionRotationIcon();
        const canvasRect = stage.container().getBoundingClientRect();
        for (const [id, button] of shadowButtons) {
        const target = nodes.get(id); 
        button.hidden = compact.matches || !target || id !== selected; 
        
        const outBtn = outlineButtons.get(id);
        if (outBtn) outBtn.hidden = button.hidden;

        if (button.hidden) continue;
        
        const center = target.getAbsoluteTransform().point({ x: target.width() / 2, y: target.height() / 2 });
        const width = target.width() * Math.abs(target.scaleX()) * stage.scaleX();
        const height = target.height() * Math.abs(target.scaleY()) * stage.scaleY();
        const radius = Math.hypot(width, height) / 2;
        
        const totalWidth = button.offsetWidth + 8 + (outBtn ? outBtn.offsetWidth : 0);
        const startX = canvasRect.left + center.x - totalWidth / 2;
        button.style.left = Math_max(8, Math_min(innerWidth - totalWidth - 8, startX)) + 'px';
        
        const stackHeight = button.offsetHeight + (id === selected ? 34 : 0);
        button.style.top = Math_max(8, Math_min(innerHeight - stackHeight - 8, canvasRect.top + center.y + radius + BUTTON_GAP)) + 'px';

        if (outBtn) {
            outBtn.style.left = (parseFloat(button.style.left) + button.offsetWidth + 8) + 'px';
            outBtn.style.top = button.style.top;
        }
        }
        
        const node = nodes.get(selected); deleteButton.hidden = compact.matches || !node;
        if (deleteButton.hidden) return;
        
        const button = shadowButtons.get(selected);
        const outBtn = outlineButtons.get(selected);
        const rect = button.getBoundingClientRect();
        
        if (outBtn) {
            const outRect = outBtn.getBoundingClientRect();
            deleteButton.style.left = ((rect.left + outRect.right) / 2 - 14) + 'px';
        } else {
            deleteButton.style.left = (rect.left + rect.width / 2 - 14) + 'px';
        }
        deleteButton.style.top = (rect.bottom + 6) + 'px';
    }
    
    const main = document.querySelector('.editor-main');
    const transitions = new Set(); let layoutFrame = 0;
    function followLayout() { positionDelete(); layoutFrame = transitions.size ? requestAnimationFrame(followLayout) : 0; }
    main?.addEventListener('transitionrun', e => { if (e.target !== main) return; transitions.add(e.propertyName); if (!layoutFrame) followLayout(); });
    function endLayoutTransition(e) { if (e.target !== main) return; transitions.delete(e.propertyName); if (!transitions.size) { cancelAnimationFrame(layoutFrame); layoutFrame = 0; } positionDelete(); }
    main?.addEventListener('transitionend', endLayoutTransition);
    main?.addEventListener('transitioncancel', endLayoutTransition);
    window.addEventListener('resize', positionDelete);
    window.addEventListener('scroll', positionDelete, true);
    
    function select(id) { selected = nodes.has(id) ? id : null; transformer.nodes(selected ? [nodes.get(selected)] : []); transformer.moveToTop(); positionDelete(); layer.batchDraw(); onSelect?.(selected); }
    function remove(id) { if (!id) return; select(null); store.change(s => { s.stickers = s.stickers.filter(item => item.id !== id); }, 'stickers'); }
    deleteButton.onclick = () => remove(selected);
    
    function commit(node) {
        const width = node.width() * node.scaleX(), height = node.height() * node.scaleY(); node.size({ width, height }); node.scale({ x: 1, y: 1 });
        const rect = node.getClientRect({ relativeTo: stage, skipShadow: true });
        if (rect.x + rect.width < 16) node.x(node.x() + 16 - rect.x - rect.width);
        if (rect.y + rect.height < 16) node.y(node.y() + 16 - rect.y - rect.height);
        if (rect.x > size.width - 16) node.x(node.x() + size.width - 16 - rect.x);
        if (rect.y > size.height - 16) node.y(node.y() + size.height - 16 - rect.y);
        store.change(s => { const item = s.stickers.find(item => item.id === node.id()); if (item) Object.assign(item, { x: node.x(), y: node.y(), width, height, rotation: node.rotation() }); }, 'stickers');
        positionDelete();
    }

    function createOutlineCanvas(img, d = 10) {
        const cvs = document.createElement('canvas');
        cvs.width = img.naturalWidth + d * 2;
        cvs.height = img.naturalHeight + d * 2;
        const ctx = cvs.getContext('2d');
        for (let dx = -d; dx <= d; dx++) {
            for (let dy = -d; dy <= d; dy++) {
                if (dx * dx + dy * dy <= d * d) {
                    ctx.drawImage(img, d + dx, d + dy);
                }
            }
        }
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, cvs.width, cvs.height);
        return cvs;
    }
    
    async function render() {
        const token = ++epoch, items = store.state.stickers;
        const decoded = await Promise.all(items.map(async item => [item, await decodeImage(item.src)]));
        if (token !== epoch) return;
        
        for (const [id, node] of nodes) {
            if (!items.some(i => i.id === id)) {
                node.destroy(); nodes.delete(id); 
                shadowButtons.get(id)?.remove(); shadowButtons.delete(id);
                outlineButtons.get(id)?.remove(); outlineButtons.delete(id);
            }
        }
        
        decoded.forEach(([item, img], index) => {
        let group = nodes.get(item.id);
        if (!group) {
            group = new K.Group({ id: item.id, draggable: true }); 
            layer.add(group); nodes.set(item.id, group);
            
            const outlineImg = new K.Image({ name: 'outline', listening: false });
            const mainImg = new K.Image({ name: 'main' }); 
            group.add(outlineImg, mainImg);

            const button = document.createElement('button'); button.type = 'button'; button.className = 'sticker-shadow-toggle sticker-shadow-canvas'; button.onclick = () => toggleShadow(item.id); document.body.append(button); shadowButtons.set(item.id, button);
            const outBtn = document.createElement('button'); outBtn.type = 'button'; outBtn.className = 'sticker-shadow-toggle sticker-outline-canvas'; outBtn.onclick = () => toggleOutline(item.id); document.body.append(outBtn); outlineButtons.set(item.id, outBtn);
            
            group.on('click tap', e => { e.cancelBubble = true; select(item.id); });
            group.on('dragstart', () => select(item.id));
            group.on('dragmove transform', positionDelete);
            group.on('dragend transformend', () => commit(group));
        }
        
        group.setAttrs({ x: item.x, y: item.y, width: item.width, height: item.height, rotation: item.rotation, scaleX: 1, scaleY: 1 }); group.zIndex(index);
        group.setAttrs({ shadowEnabled: false });
        
        const main = group.findOne('.main');
        const outline = group.findOne('.outline');
        
        const hasShadow = !!item.shadow;
        const hasOutline = !!item.outline;

        main.clearCache();
        main.setAttrs({ 
            image: img, width: item.width, height: item.height,
            shadowEnabled: !hasOutline && hasShadow,
            shadowColor: '#000', shadowOpacity: 0.3, shadowOffsetX: 0, shadowOffsetY: 4, shadowBlur: 4 
        });

        outline.clearCache();
        if (hasOutline) {
            if (!img._outlineCvs) img._outlineCvs = createOutlineCanvas(img, 10); //외곽선
            const scaleX = item.width / img.naturalWidth;
            const scaleY = item.height / img.naturalHeight;
            const d = 10; //외곽선
            outline.setAttrs({
                image: img._outlineCvs,
                x: -d * scaleX, y: -d * scaleY,
                width: item.width + (d * 2 * scaleX), height: item.height + (d * 2 * scaleY),
                visible: true,
                shadowEnabled: hasShadow,
                shadowColor: '#000', shadowOpacity: 0.3, shadowOffsetX: 0, shadowOffsetY: 4, shadowBlur: 4 
            });
            outline.cache();
        } else {
            outline.hide();
        }

        const button = shadowButtons.get(item.id); button.textContent = hasShadow ? '그림자 삭제' : '그림자 추가'; button.setAttribute('aria-pressed', String(hasShadow)); button.setAttribute('aria-label', item.name + ' ' + button.textContent);
        const outBtn = outlineButtons.get(item.id); outBtn.textContent = hasOutline ? '외곽선 삭제' : '외곽선 추가'; outBtn.setAttribute('aria-pressed', String(hasOutline)); outBtn.setAttribute('aria-label', item.name + ' ' + outBtn.textContent);
        });
        
        if (selected && !nodes.has(selected)) selected = null;
        transformer.nodes(selected ? [nodes.get(selected)] : []); transformer.moveToTop(); positionDelete(); layer.batchDraw();
    }
    
    compact.addEventListener('change', () => { transformer.anchorSize(compact.matches ? 16 : 10); positionDelete(); layer.batchDraw(); });
    stage.on('click tap', e => { if (e.target === stage || (!nodes.has(e.target.id()) && e.target.getParent() !== transformer)) select(null); });
    document.addEventListener('keydown', e => {
        if (!compact.matches && selected && !document.querySelector('dialog[open]') && !e.target.closest('input,textarea,select,[contenteditable="true"]') && (e.key === 'Delete' || e.key === 'Backspace')) { e.preventDefault(); remove(selected); }
    });
    
    return {
        layer, transformer, deleteButton, render, select, remove, positionDelete, toggleShadow,
        async add(src, name) {
        if (store.state.stickers.length >= MAX_STICKERS) throw new Error(`스티커는 최대 ${MAX_STICKERS}개까지 추가할 수 있어요.`);
        const img = await decodeImage(src), scale = Math_min(300 / img.naturalWidth, 300 / img.naturalHeight);
        const id = crypto.randomUUID(), width = img.naturalWidth * scale, height = img.naturalHeight * scale;
        
        store.change(s => s.stickers.push({ id, name, src, x: (size.width - width) / 2, y: (size.height - height) / 2, width, height, rotation: 0, shadow: false, outline: false }), 'stickers');
        await render(); select(id); notify('스티커를 추가했어요. 캔버스에서 이동·크기 조절·회전할 수 있어요.');
        }
    };
    }