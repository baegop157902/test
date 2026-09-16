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
                .sticker-list { padding-bottom: 140px !important; }
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

    
    const initDragDrop = () => {
        const stickerList = document.querySelector('.sticker-list');
        if (!stickerList || stickerList._hasDragLogic) return;
        stickerList._hasDragLogic = true;

        stickerList.addEventListener('wheel', (e) => {
            // 세로 스크롤(deltaY) 값이 있을 때만 작동
            if (e.deltaY !== 0) {
                e.preventDefault(); // 웹페이지 전체가 위아래로 흔들리는 것을 방지
                stickerList.scrollLeft += e.deltaY; // 세로 휠 굴린 만큼 가로로 이동
            }
        }, { passive: false });
        
        let draggingCard = null;
        let placeholder = null;
        let startX = 0, startY = 0, initialX = 0, initialY = 0, startIndex = -1;

        stickerList.addEventListener('pointerdown', (e) => {
            const handle = e.target.closest('.sticker-drag-handle');
            if (!handle) return;
            if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return; // 좌클릭/터치만 허용

            const card = handle.closest('.sticker-card');
            if (!card) return;

            e.preventDefault();
            handle.setPointerCapture(e.pointerId);

            draggingCard = card;
            const rect = card.getBoundingClientRect();
            
            const allCards = [...stickerList.querySelectorAll('.sticker-card:not(.add-sticker)')];
            startIndex = allCards.indexOf(card);

            startX = e.clientX;
            startY = e.clientY;
            initialX = rect.left;
            initialY = rect.top;

            placeholder = document.createElement('div');
            placeholder.className = 'sticker-card drag-placeholder';
            placeholder.style.width = rect.width + 'px';
            placeholder.style.height = rect.height + 'px';
            placeholder.style.flexShrink = '0';
            
            const computed = getComputedStyle(card);
            placeholder.style.margin = computed.margin;

            card.parentNode.insertBefore(placeholder, card.nextSibling);

            card.classList.add('is-dragging');
            card.style.position = 'fixed';
            card.style.left = initialX + 'px';
            card.style.top = initialY + 'px';
            card.style.width = rect.width + 'px';
            card.style.height = rect.height + 'px';
            card.style.zIndex = '99999';
            card.style.margin = '0';
        });

        stickerList.addEventListener('pointermove', (e) => {
            if (!draggingCard) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            draggingCard.style.left = (initialX + dx) + 'px';
            draggingCard.style.top = (initialY + dy) + 'px';

            // 양옆 가장자리 터치 시 리스트 자동 스크롤
            const listRect = stickerList.getBoundingClientRect();
            if (e.clientX < listRect.left + 50) stickerList.scrollLeft -= 15;
            else if (e.clientX > listRect.right - 50) stickerList.scrollLeft += 15;

            // 커서 아래에 있는 카드 식별
            draggingCard.style.pointerEvents = 'none'; 
            const target = document.elementFromPoint(e.clientX, e.clientY);
            
            if (!target) return;
            const targetCard = target.closest('.sticker-card:not(.is-dragging)');
            
            if (targetCard && targetCard !== placeholder) {
                const targetRect = targetCard.getBoundingClientRect();
                const pastMiddleX = e.clientX > targetRect.left + targetRect.width / 2;
                
                const siblings = [...stickerList.querySelectorAll('.sticker-card, .add-sticker')].filter(c => c !== draggingCard && c !== placeholder);
                const rects = siblings.map(c => ({ el: c, rect: c.getBoundingClientRect() }));

                if (pastMiddleX) {
                    targetCard.parentNode.insertBefore(placeholder, targetCard.nextSibling);
                } else {
                    targetCard.parentNode.insertBefore(placeholder, targetCard);
                }

                // FLIP 애니메이션 기법 (카드가 부드럽게 스르륵 밀려나는 모션)
                rects.forEach(({ el, rect }) => {
                    const newRect = el.getBoundingClientRect();
                    const moveX = rect.left - newRect.left;
                    const moveY = rect.top - newRect.top;
                    if (moveX || moveY) {
                        el.style.transform = `translate(${moveX}px, ${moveY}px)`;
                        el.style.transition = 'none';
                        requestAnimationFrame(() => {
                            el.style.transform = '';
                            el.style.transition = 'transform 0.25s cubic-bezier(0.2, 1, 0.2, 1)';
                        });
                    }
                });
            }
        });

        const endDrag = (e) => {
            if (!draggingCard) return;
            
            const handle = draggingCard.querySelector('.sticker-drag-handle');
            if(handle) handle.releasePointerCapture(e.pointerId);

            draggingCard.classList.remove('is-dragging');
            draggingCard.style.position = '';
            draggingCard.style.left = '';
            draggingCard.style.top = '';
            draggingCard.style.width = '';
            draggingCard.style.height = '';
            draggingCard.style.zIndex = '';
            draggingCard.style.margin = '';
            draggingCard.style.pointerEvents = '';
            
            const allCards = [...stickerList.querySelectorAll('.sticker-card:not(.add-sticker)')].filter(c => c !== draggingCard);
            let newIndex = allCards.indexOf(placeholder);
            
            placeholder.parentNode.insertBefore(draggingCard, placeholder);
            placeholder.remove();
            
            const id = draggingCard.dataset.id;
            const oldIndex = startIndex;
            
            draggingCard = null;
            placeholder = null;

            // 순서가 변경되었다면 스토어(상태)를 갱신합니다.
            if (oldIndex !== newIndex && newIndex !== -1 && oldIndex !== -1) {
                // 1. 상태가 갱신되어 화면이 초기화되기 직전에 현재 스크롤 위치를 기억합니다.
                const currentScroll = stickerList.scrollLeft;

                store.change(s => {
                    const item = s.stickers.splice(oldIndex, 1)[0];
                    s.stickers.splice(newIndex, 0, item);
                }, 'stickers');
                
                render().then(() => {
                    select(id);
                    // 2. 렌더링이 완전히 끝난 후 찰나의 순간에 스크롤을 원래 위치로 복구합니다.
                    requestAnimationFrame(() => {
                        const currentList = document.querySelector('.sticker-list');
                        if (currentList) currentList.scrollLeft = currentScroll;
                    });
                });
            }
        };

        stickerList.addEventListener('pointerup', endDrag);
        stickerList.addEventListener('pointercancel', endDrag);
    };

    let isInjecting = false;
    let savedScrollLeft = 0; // 🔥 [추가됨] 사용자의 실시간 스크롤 위치를 저장할 변수
    
    const injectMobileButtons = () => {
        if (isInjecting) return;
        isInjecting = true;
        
        // 🔥 [추가됨] 스크롤 위치 저장 및 자동 복구 로직
        const stickerList = document.querySelector('.sticker-list');
        if (stickerList) {
            // 1. 클릭 등으로 리스트가 새로 그려져 스크롤이 0이 되면, 기억해둔 위치로 복구합니다.
            if (stickerList.scrollLeft === 0 && savedScrollLeft > 0) {
                stickerList.scrollLeft = savedScrollLeft;
            }
            
            // 2. 사용자가 스크롤을 할 때마다 그 위치를 실시간으로 업데이트합니다.
            if (!stickerList._hasScrollTracker) {
                stickerList._hasScrollTracker = true;
                stickerList.addEventListener('scroll', () => {
                    savedScrollLeft = stickerList.scrollLeft;
                }, { passive: true });
            }
        }
        
        const cards = document.querySelectorAll('.sticker-list .sticker-card:not(.add-sticker)');
        
        if (cards.length > 0) {
            store.state.stickers.forEach((item, i) => {
                const card = cards[i];
                if (!card) return;
                
                card.dataset.id = item.id; // 드래그 앤 드롭에서 고유 식별을 위해 ID 주입

                const hasOutline = !!item.outline;

                // 1. 외곽선 버튼 유지
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
                    card.appendChild(outlineBtn);
                }
                
                outlineBtn.onclick = (e) => { e.stopPropagation(); toggleOutline(item.id); };
                const newText = hasOutline ? '외곽선 삭제' : '외곽선 추가';
                if (outlineBtn.textContent !== newText) outlineBtn.textContent = newText;
                const newPressed = String(hasOutline);
                if (outlineBtn.getAttribute('aria-pressed') !== newPressed) outlineBtn.setAttribute('aria-pressed', newPressed);

                // 🔥 만약 이전 단계에서 만든 상/하 버튼 흔적이 남아있다면 제거
                const oldControls = card.querySelector('.mobile-layer-controls');
                if (oldControls) oldControls.remove();

                // 2. 새로운 드래그 핸들 (<i class="bi bi-list"></i>) 생성 (좌측 상단)
                let dragHandle = card.querySelector('.sticker-drag-handle');
                if (!dragHandle) {
                    dragHandle = document.createElement('div');
                    dragHandle.className = 'sticker-drag-handle';
                    dragHandle.innerHTML = '<i class="bi bi-list"></i>';
                    dragHandle.setAttribute('aria-label', '드래그하여 순서 변경');
                    card.appendChild(dragHandle);
                }
            });
            
            // 리스트 렌더링이 끝나면 드래그 이벤트 엔진을 가동합니다. (최초 1회만 등록됨)
            initDragDrop();
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

    const layerUpBtn = document.createElement('button'); 
    layerUpBtn.className = 'sticker-layer-btn'; layerUpBtn.type = 'button'; layerUpBtn.setAttribute('aria-label', '앞으로 가져오기');
    layerUpBtn.innerHTML = '<i class="bi bi-arrow-up-circle-fill"></i>'; layerUpBtn.hidden = true; document.body.append(layerUpBtn);
    
    const layerDownBtn = document.createElement('button'); 
    layerDownBtn.className = 'sticker-layer-btn'; layerDownBtn.type = 'button'; layerDownBtn.setAttribute('aria-label', '뒤로 보내기');
    layerDownBtn.innerHTML = '<i class="bi bi-arrow-down-circle-fill"></i>'; layerDownBtn.hidden = true; document.body.append(layerDownBtn);

    // 레이어 순서 변경 함수
    async function moveLayer(direction) {
        if (!selected) return;
        let changed = false;
        store.change(s => {
            const idx = s.stickers.findIndex(i => i.id === selected);
            // UP(위로): 캔버스 맨 앞(배열 인덱스 0)으로 가야 하므로 위치를 뺍니다(감소).
            if (direction === 'up' && idx > 0) {
                [s.stickers[idx], s.stickers[idx - 1]] = [s.stickers[idx - 1], s.stickers[idx]];
                changed = true;
            } 
            // DOWN(아래로): 캔버스 맨 뒤(배열 끝)로 가야 하므로 위치를 더합니다(증가).
            else if (direction === 'down' && idx < s.stickers.length - 1) {
                [s.stickers[idx], s.stickers[idx + 1]] = [s.stickers[idx + 1], s.stickers[idx]];
                changed = true;
            }
        }, 'stickers');
        
        if (changed) {
            await render(); // 배열 순서가 바뀌었으므로 캔버스 재렌더링
            select(selected); // 선택 유지 및 위치/UI 업데이트
        }
    }
    layerUpBtn.onclick = () => moveLayer('up');
    layerDownBtn.onclick = () => moveLayer('down');
    
    function positionDelete() {
        positionRotationIcon();
        const canvasRect = stage.container().getBoundingClientRect();
        for (const [id, button] of shadowButtons) {
        const target = nodes.get(id); 
        button.hidden = compact.matches || !target || id !== selected; 
        
        const outBtn = outlineButtons.get(id);
        if (outBtn) outBtn.hidden = button.hidden;

        if (button.hidden) continue;
        
        const rect = target.getClientRect({ skipShadow: true }); 

        const totalWidth = button.offsetWidth + 8 + (outBtn ? outBtn.offsetWidth : 0);
        const startX = canvasRect.left + rect.x + (rect.width / 2) - (totalWidth / 2);
        button.style.left = Math_max(8, Math_min(innerWidth - totalWidth - 8, startX)) + 'px';

        const stackHeight = button.offsetHeight + (id === selected ? 34 : 0);
        // 이미지 시각적 경계의 하단(rect.y + rect.height)에서 정확히 8px 아래에 고정합니다.
        button.style.top = Math_max(8, Math_min(innerHeight - stackHeight - 8, canvasRect.top + rect.y + rect.height + 8)) + 'px';

        if (outBtn) {
            outBtn.style.left = (parseFloat(button.style.left) + button.offsetWidth + 8) + 'px';
            outBtn.style.top = button.style.top;
        }
        }
        
        const node = nodes.get(selected); deleteButton.hidden = compact.matches || !node;
        layerUpBtn.hidden = deleteButton.hidden;
        layerDownBtn.hidden = deleteButton.hidden;
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

        const tRect = node.getClientRect({ skipShadow: true });
        const rightX = canvasRect.left + tRect.x + tRect.width + 8; // 박스 우측 경계에서 8px 띄움
        const topY = canvasRect.top + tRect.y; // 박스 상단 위치

        layerUpBtn.style.left = rightX + 'px';
        layerUpBtn.style.top = topY + 'px';
        
        layerDownBtn.style.left = rightX + 'px';
        layerDownBtn.style.top = (topY + 34) + 'px'; // up 버튼 바로 아래에 34px 간격으로 배치

        // 더 이상 올리거나 내릴 수 없을 때(최상단/최하단) 버튼을 반투명하게 비활성화
        const idx = store.state.stickers.findIndex(i => i.id === selected);
        // 인덱스가 0일 때 가장 위(앞)에 있으므로 UP 버튼 비활성화
        layerUpBtn.classList.toggle('is-disabled', idx === 0);
        layerDownBtn.classList.toggle('is-disabled', idx === store.state.stickers.length - 1);
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

            // 1. 드래그(이동) 시에는 버튼이 그대로 따라다닙니다.
            group.on('dragmove', positionDelete);

            // 2. 회전이나 크기 조절 중에는 버튼을 잠깐 숨깁니다.
            group.on('transform', () => { 
                const btn = shadowButtons.get(item.id);
                const outBtn = outlineButtons.get(item.id);
                if (btn) btn.hidden = true;
                if (outBtn) outBtn.hidden = true;
                deleteButton.hidden = true;

                layerUpBtn.hidden = true;
                layerDownBtn.hidden = true;
            });

            // 3. 조작이 끝나면 commit 내부에서 위치를 재계산하고 버튼이 다시 나타납니다.
            group.on('dragend transformend', () => commit(group));
        }
        
        group.setAttrs({ x: item.x, y: item.y, width: item.width, height: item.height, rotation: item.rotation, scaleX: 1, scaleY: 1 }); 
        // 배열의 앞쪽(인덱스가 낮을수록) Z-index 값을 높게 주어 맨 앞으로 가져옵니다.
        group.zIndex(items.length - 1 - index); 
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
        
        store.change(s => s.stickers.unshift({ id, name, src, x: (size.width - width) / 2, y: (size.height - height) / 2, width, height, rotation: 0, shadow: false, outline: false }), 'stickers');
        await render(); select(id); notify('스티커를 추가했어요. 캔버스에서 이동·크기 조절·회전할 수 있어요.');
        }
    };
    }