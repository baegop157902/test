export const templateId = 'pattern-header';
export const author = '@baegop157902';
export const size = {
    width: 1500,
    height: 500
};

export const tabs = [
    { id: 'common', label: '메인', heading: '메인' },
    { id: 'stickers', label: '스티커', type: 'stickers' }
];

export const groups = [
    ['pattern', '패턴'],
    ['img', '이미지']
];

export const positions = {
    'common-img-image': {
        x: 0,
        y: 0
    }
};

export function imageId(side, group) {
    return `${side}-${group}-image`;
}

export function fields(side, group) {
    const field = (key, label, type = 'text') => ({
        id: `${side}-${key}`,
        label,
        type
    });

    if (group === 'pattern') {
        return [
            {
                ...field('pattern-mode', '패턴 종류', 'radio'),
                options: [
                    { value: 'tile1', label: '깅엄' },
                    { value: 'tile2', label: '타탄' },
                    { value: 'solid', label: '단색' }
                ]
            },
            { ...field('tile1-color1', '체크바탕색', 'color'), visibleWhen: { id: `${side}-pattern-mode`, value: 'tile1' } },
            { ...field('tile1-color2', '체크무늬색', 'color'), visibleWhen: { id: `${side}-pattern-mode`, value: 'tile1' } },
            
            { ...field('tile2-thick-color', '굵은 선', 'color'), visibleWhen: { id: `${side}-pattern-mode`, value: 'tile2' } },
            { ...field('tile2-thin-color', '얇은 선', 'color'), visibleWhen: { id: `${side}-pattern-mode`, value: 'tile2' } },
            
            { ...field('pattern-scale', '패턴 크기', 'number'), min: 0, max: 200 },
            { ...field('pattern-rotation', '패턴 회전', 'number'), min: -180, max: 180 },
            { ...field('pattern-opacity', '패턴 투명도', 'number'), min: 0, max: 100 },
            
            field('pattern-blur', '패턴 블러', 'checkbox'),
            field('pattern-bg-color', '뒷배경색', 'color')
        ];
    }

    if (group === 'img') {
        return [
            field('img-is-pattern', '패턴', 'checkbox'), // 최상단 패턴 토글 버튼
            { ...field('img-scale', '이미지 크기', 'number'), min: 0, max: 200 },
            { ...field('img-x', '가로 위치', 'number'), min: 0, max: 100 }, // 위치 슬라이더
            { ...field('img-y', '세로 위치', 'number'), min: 0, max: 100 }, // 위치 슬라이더
            { ...field('img-rotation', '이미지 회전', 'number'), min: -180, max: 180 },
            { ...field('img-opacity', '이미지 투명도', 'number'), min: 0, max: 100 },
            field('img-blur', '이미지 블러', 'checkbox')
        ];
    }
    
    return [];
}

export function initialState(id = templateId) {
    const values = {
        'common-pattern-mode': 'tile1',
        'common-tile1-color1': '#ffffff',
        'common-tile1-color2': '#d1c2fa',
        'common-tile2-thick-color': '#83c76f',
        'common-tile2-thin-color': '#9cf1c2',
        'common-pattern-scale': 100,
        'common-pattern-rotation': 45,
        'common-pattern-opacity': 70,
        'common-pattern-blur': false,
        'common-pattern-bg-color': '#ffffff',
        
        'common-img-scale': 100,
        'common-img-rotation': 0,
        'common-img-opacity': 100,
        'common-img-blur': false,
        'common-img-is-pattern': true, 
        'common-img-scale': 100,
        'common-img-x': 50,
        'common-img-y': 50,
        'common-img-rotation': 0,
        'common-img-opacity': 100,
        'common-img-blur': false
    };

    return {
        schemaVersion: 1,
        templateId: id,
        values,
        touched: {},
        images: {},
        stickers: []
    };
}

let savedEditorPosition = null; // 에디터 위치를 기억할 전역 변수

function injectCustomUI(openEditor) {
    if (document.getElementById('pattern-header-style')) return;

    const style = document.createElement('style');
    style.id = 'pattern-header-style';
    style.textContent = `
        @media (min-width: 769px) {
            section.floating-editor.is-pattern-editor { width: 380px !important; }
        }
        .custom-range-slider { flex: 1; cursor: pointer; min-width: 80px; }
        
        .pc-custom-tabs { display: flex; gap: 8px; justify-content: center; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #eee; }
        
        .pc-custom-tab-btn {
            padding: 6px 16px;
            border: 1px solid #b6bfca;
            border-radius: 20px;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(216, 223, 232, 0.5));
            color: #252b33;
            font-weight: 700;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, .8), 0 2px 5px rgba(35, 43, 58, .045);
            font-size: 13px;
            cursor: pointer;
            transition: background 0.2s;
        }
        .pc-custom-tab-btn[aria-pressed="true"] {
            background: #dfe4eb;
        }
    `;
    document.head.appendChild(style);

    const observer = new MutationObserver(() => {
        const isPattern = !!(document.getElementById('common-pattern-scale') || document.querySelector('input[name="common-pattern-scale"]'));
        const isImg = !!(document.getElementById('common-img-scale') || document.querySelector('input[name="common-img-scale"]'));
        const isPatternEditor = isPattern || isImg;

        const floatingEditor = document.querySelector('section.floating-editor');
        if (floatingEditor) {
            // 🔥 화면이 다시 그려질 때 저장된 위치가 있다면 즉시 복구합니다.
            if (savedEditorPosition) {
                floatingEditor.style.left = savedEditorPosition.left;
                floatingEditor.style.top = savedEditorPosition.top;
                floatingEditor.style.transform = savedEditorPosition.transform;
                savedEditorPosition = null; 
            }

            floatingEditor.classList.toggle('is-pattern-editor', isPatternEditor);

            if (isPatternEditor) {
                let tabsContainer = floatingEditor.querySelector('.pc-custom-tabs');
                if (!tabsContainer) {
                    tabsContainer = document.createElement('div');
                    tabsContainer.className = 'pc-custom-tabs';

                    const btnPattern = document.createElement('button');
                    btnPattern.type = 'button';
                    btnPattern.className = 'pc-custom-tab-btn';
                    btnPattern.textContent = '패턴';
                    btnPattern.onclick = () => { 
                        if (!isPattern) { 
                            // 탭 이동 직전 위치 기억
                            savedEditorPosition = { left: floatingEditor.style.left, top: floatingEditor.style.top, transform: floatingEditor.style.transform };
                            openEditor('common', 'pattern'); 
                        } 
                    };

                    const btnImg = document.createElement('button');
                    btnImg.type = 'button';
                    btnImg.className = 'pc-custom-tab-btn';
                    btnImg.textContent = '이미지';
                    btnImg.onclick = () => { 
                        if (!isImg) { 
                            // 탭 이동 직전 위치 기억
                            savedEditorPosition = { left: floatingEditor.style.left, top: floatingEditor.style.top, transform: floatingEditor.style.transform };
                            openEditor('common', 'img'); 
                        } 
                    };

                    tabsContainer.append(btnPattern, btnImg);

                    const title = floatingEditor.querySelector('h3');
                    if (title) title.insertAdjacentElement('afterend', tabsContainer);
                    else floatingEditor.prepend(tabsContainer);
                }

                const btns = tabsContainer.querySelectorAll('button');
                if (btns.length === 2) {
                    if (btns[0].getAttribute('aria-pressed') !== String(isPattern)) btns[0].setAttribute('aria-pressed', String(isPattern));
                    if (btns[1].getAttribute('aria-pressed') !== String(isImg)) btns[1].setAttribute('aria-pressed', String(isImg));
                }
            }
        }

        if (!isPatternEditor) return;

        // 🔥 새 슬라이더 2종(img-x, img-y) 추가
        const targets = [
            { id: 'common-pattern-scale', min: 0, max: 200 },
            { id: 'common-pattern-rotation', min: -180, max: 180 },
            { id: 'common-pattern-opacity', min: 0, max: 100 },
            { id: 'common-img-scale', min: 0, max: 200 },
            { id: 'common-img-x', min: 0, max: 100 }, // 가로위치
            { id: 'common-img-y', min: 0, max: 100 }, // 세로위치
            { id: 'common-img-rotation', min: -180, max: 180 },
            { id: 'common-img-opacity', min: 0, max: 100 }
        ];

        targets.forEach(t => {
            const input = document.getElementById(t.id) || document.querySelector(`input[name="${t.id}"]`);
            
            if (input && input.tagName === 'INPUT') {
                const prev = input.previousElementSibling;
                const hasSlider = prev && prev.classList.contains('custom-range-slider');

                if (!hasSlider) {
                    const slider = document.createElement('input');
                    slider.type = 'range';
                    slider.min = t.min;
                    slider.max = t.max;
                    slider.value = input.value || t.min;
                    slider.className = 'custom-range-slider';

                    const parent = input.parentElement;
                    parent.style.display = 'flex';
                    parent.style.alignItems = 'center';
                    parent.style.gap = '10px';

                    input.style.width = '60px';
                    input.style.flex = 'none';

                    parent.insertBefore(slider, input);

                    slider.addEventListener('input', (e) => {
                        input.value = e.target.value;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                    });

                    input.addEventListener('input', (e) => {
                        slider.value = e.target.value;
                    });

                    const clampValue = () => {
                        let val = parseInt(input.value, 10);
                        if (isNaN(val)) val = t.min;
                        if (val < t.min) val = t.min;
                        if (val > t.max) val = t.max;
                        
                        if (input.value !== String(val)) {
                            input.value = val;
                            slider.value = val;
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    };
                    
                    input.addEventListener('change', clampValue);
                    input.addEventListener('blur', clampValue);
                }
            }
        });

        const modeRadios = document.querySelectorAll('input[name="common-pattern-mode"]');
        if (modeRadios.length > 0) {
            const selectedMode = Array.from(modeRadios).find(r => r.checked)?.value;
            ['pattern-scale', 'pattern-rotation', 'pattern-opacity', 'pattern-blur'].forEach(key => {
                const input = document.getElementById(`common-${key}`) || document.querySelector(`input[name="common-${key}"]`);
                const row = input?.closest('.field-row');
                if (row) row.style.display = selectedMode === 'solid' ? 'none' : 'flex';
            });

            modeRadios.forEach(radio => {
                if (!radio.dataset.evtInjected) {
                    radio.dataset.evtInjected = 'true';
                    radio.addEventListener('change', () => {
                        const currentMode = document.querySelector('input[name="common-pattern-mode"]:checked')?.value;
                        ['pattern-scale', 'pattern-rotation', 'pattern-opacity', 'pattern-blur'].forEach(key => {
                            const input = document.getElementById(`common-${key}`) || document.querySelector(`input[name="common-${key}"]`);
                            const row = input?.closest('.field-row');
                            if (row) row.style.display = currentMode === 'solid' ? 'none' : 'flex';
                        });
                    });
                }
            });
        }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
}

export function createScene(stage, openEditor) {
    const K = window.Konva;
    const layer = new K.Layer();
    stage.add(layer);

    injectCustomUI(openEditor);

    let currentValues = initialState().values;

    const bgRect = new K.Rect({ ...size, fill: '#ffffff' });
    
    const patternRect = new K.Rect({
        ...size,
        fillPatternRepeat: 'repeat',
        fillPatternOffsetX: size.width / 2,
        fillPatternOffsetY: size.height / 2,
        x: size.width / 2,
        y: size.height / 2,
        offset: { x: size.width / 2, y: size.height / 2 }
    });

    const silhouetteRect = new K.Rect({
        ...size,
        fillPatternRepeat: 'repeat',
        fillPatternOffsetX: size.width / 2,
        fillPatternOffsetY: size.height / 2,
        x: size.width / 2,
        y: size.height / 2,
        offset: { x: size.width / 2, y: size.height / 2 },
        listening: false
    });

    const imgRect = new K.Rect({
        ...size,
        fillPatternRepeat: 'repeat',
        fillPatternOffsetX: size.width / 2,
        fillPatternOffsetY: size.height / 2,
        x: size.width / 2,
        y: size.height / 2,
        offset: { x: size.width / 2, y: size.height / 2 },
        listening: false
    });

    layer.add(bgRect, patternRect, silhouetteRect, imgRect);

    function createWhiteSilhouette(img) {
        if (!img) return null;
        const cvs = document.createElement('canvas');
        cvs.width = img.naturalWidth;
        cvs.height = img.naturalHeight;
        const ctx = cvs.getContext('2d');
        ctx.drawImage(img, 0, 0);
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, cvs.width, cvs.height);
        return cvs;
    }

    function generateTile1(color1, color2) {
        const cvs = document.createElement('canvas');
        cvs.width = 80; cvs.height = 80;
        const ctx = cvs.getContext('2d');
        ctx.fillStyle = color1; ctx.fillRect(0, 0, 80, 80);
        ctx.fillStyle = color2; ctx.globalAlpha = 0.5;
        ctx.fillRect(0, 0, 40, 80); ctx.fillRect(0, 0, 80, 40);
        return cvs;
    }

    function generateTile2(thickColor, thinColor) {
        const cvs = document.createElement('canvas');
        cvs.width = 120; cvs.height = 120;
        const ctx = cvs.getContext('2d');
        ctx.fillStyle = thickColor; ctx.globalAlpha = 0.4;
        ctx.fillRect(15, 0, 25, 120); ctx.fillRect(0, 18, 120, 28);
        ctx.globalAlpha = 1.0; ctx.strokeStyle = thinColor; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(90, 0); ctx.lineTo(90, 120); ctx.moveTo(0, 90); ctx.lineTo(120, 90); ctx.stroke();
        return cvs;
    }

    function applyProperties() {
        const pMode = currentValues['common-pattern-mode'];
        const pScale = currentValues['common-pattern-scale'] / 100;
        const pRotation = currentValues['common-pattern-rotation'];
        const pOpacity = currentValues['common-pattern-opacity'] / 100;
        const pBlur = currentValues['common-pattern-blur'];
        
        const iScale = currentValues['common-img-scale'] / 100;
        const iRotation = currentValues['common-img-rotation'];
        const iOpacity = currentValues['common-img-opacity'] / 100;
        const iBlur = currentValues['common-img-blur'];
        
        bgRect.fill(currentValues['common-pattern-bg-color']);
        
        patternRect.clearCache();
        patternRect.opacity(pOpacity);
        patternRect.fillPatternRotation(pRotation);
        patternRect.fillPatternScale({ x: pScale, y: pScale });

        if (pMode === 'tile1') {
            patternRect.fillPatternImage(generateTile1(currentValues['common-tile1-color1'], currentValues['common-tile1-color2']));
        } else if (pMode === 'tile2') {
            patternRect.fillPatternImage(generateTile2(currentValues['common-tile2-thick-color'], currentValues['common-tile2-thin-color']));
        } else if (pMode === 'solid') {
            patternRect.fillPatternImage(null);
        }

        // 패턴 블러
        if (pBlur && pMode !== 'solid') {
            patternRect.filters([K.Filters.Blur]);
            patternRect.blurRadius(10);
            patternRect.cache();
        } else {
            patternRect.filters([]);
        }

        //
        imgRect.clearCache();
        silhouetteRect.clearCache();

        const iIsPattern = currentValues['common-img-is-pattern'] ?? true;
        const iX = currentValues['common-img-x'] ?? 50; 
        const iY = currentValues['common-img-y'] ?? 50;

        imgRect.opacity(iOpacity);
        imgRect.fillPatternRotation(iRotation);
        imgRect.fillPatternScale({ x: iScale, y: iScale });

        silhouetteRect.fillPatternRotation(iRotation);
        silhouetteRect.fillPatternScale({ x: iScale, y: iScale });
        
        const img = imgRect.fillPatternImage();
        if (img) {
            // 🔥 패턴 체크박스에 따른 반복(repeat) 여부 설정
            const repeatMode = iIsPattern ? 'repeat' : 'no-repeat';
            imgRect.fillPatternRepeat(repeatMode);
            silhouetteRect.fillPatternRepeat(repeatMode);

            // 스케일 값이 작을 때 화면 밖으로 도망가는 것을 막기 위한 안전장치
            const safeScale = iScale || 0.01;
            
            // 타일 모드일 때는 기본 offset이 캔버스 중심, 단일 이미지일 때는 이미지 중심을 캔버스 중앙에 맞춤
            const baseOffsetX = iIsPattern ? size.width / 2 : (img.width / 2 - (size.width / 2) / safeScale);
            const baseOffsetY = iIsPattern ? size.height / 2 : (img.height / 2 - (size.height / 2) / safeScale);

            // 슬라이더 이동값 계산 (50을 기준으로 ±이동, 스케일 비율에 맞춰 일정한 속도감 유지)
            const moveX = (50 - iX) * (size.width / 50) / safeScale;
            const moveY = (50 - iY) * (size.height / 50) / safeScale;

            // 최종 위치 적용
            imgRect.fillPatternOffsetX(baseOffsetX + moveX);
            imgRect.fillPatternOffsetY(baseOffsetY + moveY);
            
            silhouetteRect.fillPatternOffsetX(baseOffsetX + moveX);
            silhouetteRect.fillPatternOffsetY(baseOffsetY + moveY);
        }
        
        //
        if (iBlur && imgRect.fillPatternImage()) {
            imgRect.filters([K.Filters.Blur]);
            imgRect.blurRadius(5);
            imgRect.cache();
            
            silhouetteRect.filters([K.Filters.Blur]);
            silhouetteRect.blurRadius(5);
            silhouetteRect.cache();
        } else {
            imgRect.filters([]);
            silhouetteRect.filters([]);
        }
        
        layer.batchDraw();
    }

    applyProperties();

    bgRect.on('click tap', e => { e.cancelBubble = true; openEditor('common', 'pattern', bgRect); });
    patternRect.on('click tap', e => { e.cancelBubble = true; openEditor('common', 'pattern', patternRect); });

    [bgRect, patternRect].forEach(node => {
        node.on('mouseenter', () => { stage.container().style.cursor = 'pointer'; });
        node.on('mouseleave', () => { stage.container().style.cursor = ''; });
    });

    return {
        layer,
        updateValues(values) {
            currentValues = values;
            applyProperties();
        },
        updateImage(id, img) {
            if (id === 'common-img-image') {
                if (img) {
                    imgRect.fillPatternImage(img);
                    silhouetteRect.fillPatternImage(createWhiteSilhouette(img));
                    imgRect.listening(true);
                    imgRect.on('click tap', e => { e.cancelBubble = true; openEditor('common', 'img', imgRect); });
                } else {
                    imgRect.fillPatternImage(null);
                    silhouetteRect.fillPatternImage(null);
                    imgRect.listening(false);
                }
                applyProperties();
                layer.batchDraw();
            }
        }
    };
}

export function imageField(side, group) {
    if (group !== 'img') return null; 
    return {
        id: 'common-img-image',
        ...positions['common-img-image'],
        width: undefined,
        height: undefined,
        aspectRatio: 0,
        freeCrop: true, 
        className: 'custom-img-upload',
        placement: 'beforeFields' 
    };
}

export default {
    templateId,
    author,
    size,
    tabs,
    groups,
    fields,
    positions,
    imageField,
    initialState,
    createScene
};