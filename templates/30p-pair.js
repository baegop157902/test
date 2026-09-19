export const templateId = '30p-pair';
export const author = '@baegop157902 | 30명까지 가능해요.';
export const size = {
    width: 615,
    height: 694
};
export const groups = [
    ['main', '메인이미지'],
    ['sub', '참고이미지'],
    ['info', '정보']
];
export const fonts = ['Pretendard'];
export const formOptions = {
    desktopCategories: true,
    scrollTabs: true,
    panelClass: 'multi-character-editor',
    preservePanelPosition: true
};
const MAX = 30;
const memberId = n => `member-${n}`;
const boxes = {
    main: {
        x: 20,
        y: 158,
        width: 274,
        height: 394,
        radius: 25
    },
    sub: {
        x: 338,
        y: 158,
        width: 238,
        height: 238,
        radius: 119,
        round: true
    }
};
export const positions = Object.fromEntries(Array.from({
        length: MAX
    }, (_, i) =>
    Object.entries(boxes).map(([key, box]) => [`${memberId(i + 1)}-${key}-image`, {
        ...box
    }])).flat());
export function getSize(state) {
    const count = state.members.length,
        rows = Math.ceil(count / 3);
    // 가이드에 명시된 694 / 1390 / 2084px 높이.
    return {
        width: Math.min(count, 3) * 615,
        height: rows * 694 + (rows > 1 ? 2 : 0)
    };
}
export function getPositions(state) {
    return Object.fromEntries(state.members.flatMap(n => ['main', 'sub'].map(key => {
        const id = `${memberId(n)}-${key}-image`;
        return [id, positions[id]];
    })));
}
export function defaultValues(side, number) {
    const values = {
        'tab-name': `캐${number}`,
        'main-checkbox': false,
        'main-color': '#ffffff',
        'sub-checkbox': false,
        'sub-color': '#ffffff',
        'etc-text': '키',
        'name-text': '이름',
        'name-color': '#ffffff',
        'name-background': '#323232',
        'cm-text': '',
        'hair-color': '#323232',
        'left-eye-color': '#323232',
        'right-eye-color': '#323232',
        'description-text': '추가 특징을 입력하세요.',
        'main-image-citation': '',
        'sub-image-citation': ''
    };
    return Object.fromEntries(Object.entries(values).map(([key, value]) => [`${side}-${key}`, value]));
}
export function initialState(id = templateId) {
    return {
        schemaVersion: 1,
        templateId: id,
        members: [1],
        nextNumber: 2,
        values: defaultValues(memberId(1), 1),
        touched: {},
        images: {},
        stickers: []
    };
}
export function restoreState(raw, next) {
    if (!Array.isArray(raw.members) || !raw.members.length || raw.members.length > MAX ||
        raw.members.some(n => !Number.isInteger(n) || n < 1 || n > MAX) ||
        new Set(raw.members).size !== raw.members.length) throw new Error('캐릭터 목록이 올바르지 않아요.');
    if (!Number.isSafeInteger(raw.nextNumber) || raw.nextNumber < 2 || raw.nextNumber >= Number.MAX_SAFE_INTEGER)
        throw new Error('캐릭터 번호가 올바르지 않아요.');
    next.members = [...raw.members];
    next.nextNumber = raw.nextNumber;
    next.values = Object.assign({}, ...next.members.map(n => defaultValues(memberId(n), n)));
    return next;
}
// 임시 버전의 nextId/큰 ID와 이전 안내문 기본값을 보존 가능한 형태로 이전합니다.
export function migrateState(source) {
    const raw = structuredClone(source);
    if (raw.nextNumber === undefined && Array.isArray(raw.members)) {
        if (!raw.members.length || raw.members.length > MAX || new Set(raw.members).size !== raw.members.length || raw.members.some(n => !Number.isSafeInteger(n) || n < 1)) throw new Error('캐릭터 목록이 올바르지 않아요.');
        const mapping = new Map(raw.members.map((n, i) => [n, i + 1]));
        for (const field of ['values', 'images', 'touched']) {
            const result = {};
            for (const [key, value] of Object.entries(raw[field] || {})) {
                const match = /^member-(\d+)-(.+)$/.exec(key);
                if (match && mapping.has(Number(match[1]))) result[`member-${mapping.get(Number(match[1]))}-${match[2]}`] = value;
            }
            raw[field] = result;
        }
        raw.nextNumber = Math.max(Number.isSafeInteger(raw.nextId) ? raw.nextId : 2, ...raw.members.map(n => n + 1));
        raw.members = [...mapping.values()];
        delete raw.nextId;
    }
    for (const n of raw.members || [])
        for (const [key, old, value] of [
                ['etc-text', '나이나 순번 등을 입력하세요.', ''],
                ['name-text', '이름을 입력하세요.', '이름'],
                ['cm-text', '숫자만 입력하세요.', '']
            ]) {
            const id = `member-${n}-${key}`;
            if (raw.values?.[id] === old && raw.touched?.[id] !== true) raw.values[id] = value;
        }
    return raw;
}
export function addMember(store) {
    if (store.state.members.length >= MAX) return null;
    const number = Array.from({
        length: MAX
    }, (_, i) => i + 1).find(n => !store.state.members.includes(n));
    const side = memberId(number);
    store.change(s => {
        s.members.push(number);
        Object.assign(s.values, defaultValues(side, s.nextNumber++));
    }, 'structure');
    return side;
}
export function removeMember(store, side) {
    const index = store.state.members.findIndex(n => memberId(n) === side);
    if (index < 0 || store.state.members.length <= 1) return false;
    store.change(s => {
        s.members.splice(index, 1);
        for (const area of [s.values, s.touched, s.images])
            for (const key of Object.keys(area))
                if (key.startsWith(side + '-')) delete area[key];
    }, 'structure');
    return true;
}
export function tabs(state) {
    return [...state.members.map(n => ({
            id: memberId(n),
            label: state.values[`${memberId(n)}-tab-name`] || `캐${n}`,
            heading: state.values[`${memberId(n)}-tab-name`] || `캐${n}`
        })),
        {
            id: 'add-member',
            label: '+',
            icon: 'bi bi-plus',
            type: 'action',
            ariaLabel: '캐릭터 추가',
            disabled: state.members.length >= MAX,
            onClick: ({
                store
            }) => addMember(store)
        },
        {
            id: 'stickers',
            label: '스티커',
            type: 'stickers',
            groups: [],
            fixed: true
        }
    ];
}
export function moveMember(store, side, direction) {
    const index = store.state.members.findIndex(n => memberId(n) === side),
        next = index + direction;
    if (![-1, 1].includes(direction) || index < 0 || next < 0 || next >= store.state.members.length) return false;
    store.change(s => {
        [s.members[index], s.members[next]] = [s.members[next], s.members[index]];
    }, 'reorder');
    return true;
}
export function fields(side, group) {
    const f = (key, label, type = 'text', extra = {}) => ({
        id: `${side}-${key}`,
        label,
        type,
        ...extra
    });
    if (group === 'main' || group === 'sub') return [
        f(`${group}-checkbox`, group === 'main' ? '메인이미지 배경' : '참고이미지 배경', 'checkbox'),
        f(`${group}-color`, group === 'main' ? '메인이미지 배경색' : '참고이미지 배경색', 'color', {
            visibleWhen: `${side}-${group}-checkbox`
        })
    ];
    return group !== 'info' ? [] : [
        f('tab-name', '탭 이름', 'text', {
            maxLength: 20,
            changeKind: 'labels',
            keepDefault: true
        }),
        f('etc-text', '추가정보', 'text', {
            placeholder: '나이나 A&B등 포지션'
        }), f('name-text', '이름', 'text', {
            placeholder: '이름을 입력하세요.'
        }), f('name-color', '이름색', 'color', {
            row: 'name-colors'
        }),
        f('name-background', '이름 배경색', 'color', {
            row: 'name-colors'
        }), f('cm-text', '키 (cm)', 'text', {
            inputMode: 'decimal',
            placeholder: '숫자만 입력하세요.'
        }),
        f('hair-color', '머리색', 'color', {
            row: 'feature-colors'
        }), f('left-eye-color', '왼쪽눈', 'color', {
            row: 'feature-colors'
        }),
        f('right-eye-color', '오른쪽눈', 'color', {
            row: 'feature-colors'
        }), f('description-text', '기타사항', 'textarea')
    ];
}
export function imageField(side, group) {
    return boxes[group] ? {
        id: `${side}-${group}-image`,
        label: group === 'main' ? '메인 이미지' : '참고 이미지',
        ...boxes[group]
    } : null;
}
export function formActions(side, state) {
    const index = state.members.findIndex(n => memberId(n) === side);
    return [{
            label: '이 캐릭터 삭제',
            disabled: state.members.length <= 1,
            onClick: ({
                store
            }) => {
                if (confirm('이 캐릭터와 입력 내용을 삭제할까요? 나머지 캐릭터는 앞자리로 정렬됩니다.')) removeMember(store, side);
            }
        },
        {
            label: '캐릭터 왼쪽으로 이동',
            icon: 'bi bi-arrow-left-short',
            disabled: index <= 0,
            onClick: ({
                store
            }) => moveMember(store, side, -1)
        },
        {
            label: '캐릭터 오른쪽으로 이동',
            icon: 'bi bi-arrow-right-short',
            disabled: index < 0 || index >= state.members.length - 1,
            onClick: ({
                store
            }) => moveMember(store, side, 1)
        }
    ];
}
export function createScene(stage, openEditor, store) {
    const K = window.Konva,
        layer = new K.Layer();
    stage.add(layer);
    const bg = new K.Rect({
        ...size,
        fill: '#FBFBFB',
        listening: false
    });
    layer.add(bg);
    const separators = new K.Group({
        listening: false
    });
    layer.add(separators);
    const lines = Array.from({
        length: 29
    }, () => {
        const line = new K.Line({
            stroke: '#acacac',
            strokeWidth: 1,
            dash: [12, 12],
            visible: false
        });
        separators.add(line);
        return line;
    });
    const cards = [],
        images = new Map();
    let currentValues = store.state.values;
    let selectedSide = memberId(store.state.members[0]),
        selectedCategory = 'main',
        hoveredSide = null;

    function clickable(node, side) {
        node.on('click tap', e => {
            e.cancelBubble = true;
            openEditor(side, selectedCategory || 'main', node);
        });
        node.on('mouseenter', () => {
            stage.container().style.cursor = 'pointer';
            if (!compact.matches) {
                hoveredSide = side;
                previewClosed = false;
                queuePreview();
            }
        });
        node.on('mouseleave', () => stage.container().style.cursor = '');
    }

    function refreshImage(id, item) {
        const hasImage = !!item.node.image(),
            value = currentValues[`${id}-citation`] || '';
        item.bg.fill(!hasImage ? '#efefef' : currentValues[`${item.side}-${item.key}-checkbox`] ?
            currentValues[`${item.side}-${item.key}-color`] : 'rgba(0,0,0,0)');
        item.plus.visible(!hasImage);
        item.citation.text(value ? 'ⓒ ' + value : '').visible(hasImage && !!value.trim());
    }
    for (let number = 1; number <= MAX; number++) {
        const side = memberId(number),
            group = new K.Group({
                id: side,
                visible: false
            });
        layer.add(group);
        const texts = [],
            colors = [];

        function rect(attrs, binding) {
            const node = new K.Rect(attrs);
            group.add(node);
            if (binding) colors.push([node, `${side}-${binding}`]);
            return node;
        }

        function text(attrs, binding, color) {
            const fontSize = attrs.fontSize || 20;
            const node = new K.Text({
                fontFamily: 'Pretendard',
                fontStyle: '400',
                fontSize,
                letterSpacing: fontSize * -0.025,
                align: 'center',
                verticalAlign: 'middle',
                fill: '#323232',
                ...attrs
            });
            group.add(node);
            if (binding) texts.push([node, `${side}-${binding}`, binding === 'cm-text']);
            if (color) colors.push([node, `${side}-${color}`]);
            return node;
        }
        for (const [key, box] of Object.entries(boxes)) {
            const id = `${side}-${key}-image`,
                container = new K.Group({
                    x: box.x,
                    y: box.y
                });
            group.add(container);
            const background = new K.Rect({
                width: box.width,
                height: box.height,
                cornerRadius: box.radius,
                fill: '#efefef'
            });
            const clip = new K.Group({
                clipFunc(ctx) {
                    ctx.beginPath();
                    ctx.roundRect(0, 0, box.width, box.height, box.radius);
                    ctx.closePath();
                }
            });
            const node = new K.Image({
                width: box.width,
                height: box.height,
                listening: false
            });
            clip.add(node);
            const plus = new K.Text({
                text: '+',
                width: box.width,
                height: box.height,
                align: 'center',
                verticalAlign: 'middle',
                fontSize: 28,
                fill: '#a3a3a3',
                listening: false
            });
            const citation = new K.Text({
                width: box.width - 36,
                x: 18,
                y: box.height - 26,
                height: 20,
                fontSize: 14,
                fontFamily: 'Pretendard',
                align: 'center',
                fill: '#5f5f5f',
                stroke: '#ffffff',
                strokeWidth: 2,
                fillAfterStrokeEnabled: true,
                listening: false,
                visible: false
            });
            container.add(background, clip, plus, citation);
            images.set(id, {
                node,
                bg: background,
                plus,
                citation,
                side,
                key,
                box
            });
        }
        rect({
            x: 258,
            y: 20,
            width: 100,
            height: 50,
            cornerRadius: 50,
            fill: '#323232'
        });
        text({
            x: 258,
            y: 20,
            width: 100,
            height: 50,
            fontStyle: '600',
            fill: '#ffffff'
        }, 'etc-text');
        rect({
            x: 20,
            y: 81,
            width: 575,
            height: 56,
            cornerRadius: 30,
            fill: '#323232'
        }, 'name-background');
        text({
            x: 20,
            y: 81,
            width: 575,
            height: 56,
            fontSize: 32,
            fontStyle: '600',
            wrap: 'none'
        }, 'name-text', 'name-color');
        text({
            x: 20,
            y: 620,
            width: 67,
            height: 30,
            fill: '#212121',
            wrap: 'none'
        }, 'cm-text');
        text({
            x: 111,
            y: 575,
            text: 'Hair',
            fill: '#8b8b8b'
        });
        text({
            x: 214,
            y: 575,
            text: 'Eyes',
            fill: '#8b8b8b'
        });
        for (const [key, x] of [
                ['hair-color', 100],
                ['left-eye-color', 176],
                ['right-eye-color', 239]
            ])
            rect({
                x,
                y: 609,
                width: 56,
                height: 56,
                cornerRadius: 28,
                fill: '#323232'
            }, key);
        rect({
            x: 321,
            y: 423,
            width: 274,
            height: 250,
            cornerRadius: 10,
            stroke: '#a3a3a3',
            strokeWidth: 1,
            fill: 'rgba(0,0,0,0)'
        });
        text({
            x: 343,
            y: 447,
            width: 230,
            text: '기타사항',
            fill: '#8b8b8b',
            align: 'left'
        });
        text({
            x: 343,
            y: 488,
            width: 230,
            height: 160,
            fill: '#303030',
            lineHeight: 1.5,
            align: 'left',
            verticalAlign: 'top',
            wrap: 'char'
        }, 'description-text');
        // 화면 배율과 관계없이 카드 전체(빈 여백 포함)를 하나의 선택 영역으로 사용합니다.
        const hit = new K.Rect({
            name: 'member-hit-area',
            width: 615,
            height: 694,
            fill: 'rgba(0,0,0,0)'
        });
        group.add(hit);
        clickable(hit, side);
        cards.push({
            number,
            group,
            texts,
            colors
        });
    }
    const area = document.querySelector('.canvas-area');
    area.classList.add('multi-character-canvas');
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'canvas-add-member';
    add.innerHTML = '<i class="bi bi-plus" aria-hidden="true"></i>';
    add.setAttribute('aria-label', '캐릭터 추가');
    add.onclick = () => addMember(store);
    area.append(add);
    const preview = document.createElement('div');
    preview.className = 'member-preview';
    preview.hidden = true;
    preview.setAttribute('role', 'region');
    area.append(preview);
    const previewHeader = document.createElement('div');
    previewHeader.className = 'member-preview-header';
    const previewTitle = document.createElement('strong');
    previewTitle.textContent = '캐릭터 미리보기';
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'floating-close';
    close.setAttribute('aria-label', '미리보기 닫기');
    close.innerHTML = '<i class="bi bi-x" aria-hidden="true"></i>';
    previewHeader.append(previewTitle, close);
    const previewCanvas = document.createElement('div');
    previewCanvas.className = 'member-preview-canvas';
    previewCanvas.setAttribute('role', 'img');
    const resizeHandle = document.createElement('button');
    resizeHandle.type = 'button';
    resizeHandle.className = 'member-preview-resize';
    resizeHandle.setAttribute('aria-label', '미리보기 크기 조절');
    resizeHandle.title = '드래그하거나 방향키로 크기 조절';
    resizeHandle.innerHTML = '<i class="bi bi-arrows-angle-expand" aria-hidden="true"></i>';
    preview.append(previewHeader, previewCanvas, resizeHandle);
    let previewClosed = false,
        desktopSize = {
            width: 246 * 1.5,
            height: 275 * 1.5
        };
    close.onclick = () => {
        previewClosed = true;
        queuePreview();
    };
    const previewStage = new K.Stage({
        container: previewCanvas,
        width: 246,
        height: 275
    });
    const previewLayer = new K.Layer({
        listening: false
    });
    previewStage.add(previewLayer);
    const compact = matchMedia('(max-width:1024px)');
    let overview = false;
    const showAll = document.createElement('button');
    showAll.type = 'button';
    showAll.className = 'member-show-all';
    showAll.textContent = '전체보기';
    showAll.hidden = true;
    area.append(showAll);
    showAll.onclick = () => {
        if (selectedSide === 'stickers') {
            openEditor(lastMemberSide, selectedCategory || 'main');
            return;
        }
        overview = !overview;
        queuePreview();
    };
    let lastMemberSide = selectedSide,
        desktopPosition = null,
        drag = null;
    preview.tabIndex = 0;

    function placePreview(left, top) {
        desktopPosition = {
            left: Math.max(0, Math.min(innerWidth - preview.offsetWidth, left)),
            top: Math.max(0, Math.min(innerHeight - preview.offsetHeight, top))
        };
        preview.style.left = desktopPosition.left + 'px';
        preview.style.top = desktopPosition.top + 'px';
        preview.style.bottom = 'auto';
    }
    preview.addEventListener('pointerdown', e => {
        if (compact.matches || e.button !== 0 || !e.isPrimary || e.target.closest('.floating-close')) return;
        const rect = preview.getBoundingClientRect();
        drag = {
            id: e.pointerId,
            x: e.clientX,
            y: e.clientY,
            left: rect.left,
            top: rect.top,
            resize: !!e.target.closest('.member-preview-resize'),
            width: previewStage.width(),
            height: previewStage.height()
        };
        preview.setPointerCapture(e.pointerId);
        preview.classList.add('is-dragging');
        preview.focus({
            preventScroll: true
        });
        e.preventDefault();
    });

    function resizePreview(width, height) {
        desktopSize = {
            width: Math.max(180, width),
            height: Math.max(200, height)
        };
        queuePreview();
    }
    preview.addEventListener('pointermove', e => {
        if (drag && e.pointerId === drag.id) {
            if (drag.resize) resizePreview(drag.width + e.clientX - drag.x, drag.height + e.clientY - drag.y);
            else placePreview(drag.left + e.clientX - drag.x, drag.top + e.clientY - drag.y);
        }
    });
    const stopDrag = e => {
        if (!drag || e.pointerId !== drag.id) return;
        drag = null;
        preview.classList.remove('is-dragging');
        if (preview.hasPointerCapture(e.pointerId)) preview.releasePointerCapture(e.pointerId);
    };
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) preview.addEventListener(event, stopDrag);
    preview.addEventListener('keydown', e => {
        if (compact.matches) return;
        if (e.key === 'Escape') {
            close.click();
            return;
        }
        const delta = {
            ArrowLeft: [-10, 0],
            ArrowRight: [10, 0],
            ArrowUp: [0, -10],
            ArrowDown: [0, 10]
        } [e.key];
        if (delta) {
            e.preventDefault();
            if (e.target === resizeHandle) resizePreview(desktopSize.width + delta[0], desktopSize.height + delta[1]);
            else if (!e.target.closest('button')) {
                const rect = preview.getBoundingClientRect();
                placePreview(rect.left + delta[0], rect.top + delta[1]);
            }
        }
    });
    let previewFrame = null;

    function renderPreview() {
        previewFrame = null;
        const previewSide = !compact.matches && hoveredSide && store.state.members.some(n => memberId(n) === hoveredSide) ? hoveredSide : selectedSide;
        const card = cards.find(item => memberId(item.number) === previewSide && item.group.visible());
        const many = store.state.members.length >= 7;
        const visible = many && !!card && (compact.matches ? !overview : !previewClosed);
        showAll.hidden = !many || !compact.matches;
        showAll.setAttribute('aria-pressed', String(overview));
        showAll.textContent = overview ? '개별보기' : '전체보기';
        preview.hidden = !visible;
        area.classList.toggle('member-detail-view', visible && compact.matches);
        if (!visible) return;
        const width = compact.matches ? Math.max(1, area.clientWidth - 32) : Math.min(desktopSize.width, innerWidth - 48);
        const height = compact.matches ? Math.max(1, area.clientHeight - 52) : Math.min(desktopSize.height, innerHeight - 96);
        const scale = Math.min(width / 615, height / 694);
        const output = compact.matches ? {
            width: 615 * scale,
            height: 694 * scale
        } : {
            width,
            height
        };
        preview.style.width = (output.width + (compact.matches ? 0 : 32)) + 'px';
        preview.style.height = (output.height + (compact.matches ? 0 : 80)) + 'px';
        previewStage.size(output);
        if (compact.matches) {
            preview.style.removeProperty('left');
            preview.style.removeProperty('top');
            preview.style.removeProperty('bottom');
            preview.removeAttribute('title');
        } else {
            const rect = area.getBoundingClientRect();
            placePreview(desktopPosition?.left ?? rect.left + 8, desktopPosition?.top ?? rect.bottom - preview.offsetHeight - 8);
            preview.title = '드래그하여 이동';
        }
        previewLayer.scale({
            x: scale,
            y: scale
        });
        previewLayer.position({
            x: (output.width - 615 * scale) / 2,
            y: (output.height - 694 * scale) / 2
        });
        preview.setAttribute('aria-label', `${currentValues[`${previewSide}-tab-name`] || '캐릭터'} 확대 미리보기`);
        previewCanvas.setAttribute('aria-label', preview.getAttribute('aria-label'));
        previewTitle.textContent = (currentValues[`${previewSide}-tab-name`] || '캐릭터') + ' 미리보기';
        // 선택한 카드만 복제하여 별도 UI 캔버스에 그립니다. PNG 저장에는 포함되지 않습니다.
        previewLayer.destroyChildren();
        previewLayer.add(new K.Rect({
            width: 615,
            height: 694,
            fill: '#FBFBFB'
        }));
        const clone = card.group.clone({
            x: 0,
            y: 0,
            listening: false
        });
        clone.find('.member-hit-area').forEach(node => node.destroy());
        previewLayer.add(clone);
        previewLayer.draw();
    }

    function queuePreview() {
        if (previewFrame === null) previewFrame = requestAnimationFrame(renderPreview);
    }
    new ResizeObserver(queuePreview).observe(area);
    compact.addEventListener('change', () => {
        hoveredSide = null;
        queuePreview();
    });
    window.addEventListener('resize', queuePreview);
    window.addEventListener('editor:selection', event => {
        selectedSide = event.detail.side;
        previewClosed = false;
        hoveredSide = null;
        if (store.state.members.some(n => memberId(n) === selectedSide)) lastMemberSide = selectedSide;
        else if (!store.state.members.some(n => memberId(n) === lastMemberSide)) lastMemberSide = memberId(store.state.members[0]);
        overview = selectedSide === 'stickers';
        if (groups.some(([id]) => id === event.detail.category)) selectedCategory = event.detail.category;
        queuePreview();
    });
    return {
        layer,
        updateState(state) {
            const bounds = getSize(state);
            bg.size(bounds);
            add.disabled = state.members.length >= MAX;
            for (const card of cards) {
                const index = state.members.indexOf(card.number);
                card.group.visible(index >= 0);
                if (index >= 0) {
                    const row = Math.floor(index / 3);
                    card.group.position({
                        x: index % 3 * 615,
                        y: row * 694 + (row > 0 ? 2 : 0)
                    });
                }
            }
            lines.forEach(line => line.hide());
            let index = 0;
            for (let row = 0; row < Math.ceil(state.members.length / 3); row++) {
                const y = row * 694 + (row > 0 ? 2 : 0),
                    columns = Math.min(3, state.members.length - row * 3);
                for (let col = 1; col < columns; col++) lines[index++].points([col * 615, y + 41, col * 615, y + 674]).show();
                if (row > 0) lines[index++].points([20, y - 3, bounds.width - 20, y - 3]).show();
            }
        },
        updateValues(values) {
            currentValues = values;
            for (const card of cards)
                if (card.group.visible()) {
                    for (const [node, key, cm] of card.texts) {
                        const value = values[key] || '';
                        node.text(cm ? (/^\d+(?:\.\d+)?$/.test(value.trim()) ? value.trim() + 'cm' : 'cm') : value);
                    }
                    for (const [node, key] of card.colors) node.fill(values[key]);
                    for (const key of ['main', 'sub']) {
                        const id = `${memberId(card.number)}-${key}-image`;
                        refreshImage(id, images.get(id));
                    }
                }
            layer.batchDraw();
            queuePreview();
        },
        updateImage(id, image) {
            const item = images.get(id);
            if (!item) return;
            item.node.image(image || null);
            if (image) {
                const ratio = Math.max(item.box.width / image.naturalWidth, item.box.height / image.naturalHeight);
                const width = item.box.width / ratio,
                    height = item.box.height / ratio;
                item.node.crop({
                    x: (image.naturalWidth - width) / 2,
                    y: (image.naturalHeight - height) / 2,
                    width,
                    height
                });
            }
            refreshImage(id, item);
            layer.batchDraw();
            queuePreview();
        }
    };
}
export default {
    templateId,
    author,
    size,
    groups,
    fonts,
    positions,
    getPositions,
    getSize,
    tabs,
    fields,
    imageField,
    initialState,
    restoreState,
    migrateState,
    defaultValues,
    formOptions,
    formActions,
    createScene
};